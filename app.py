import os
import re
import shutil
import pandas as pd
import tempfile
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename
import traceback
import secrets
from concurrent.futures import ThreadPoolExecutor, as_completed

# Local Modules
from core.parsers import process_file
from core.analytics import run_analytics_pipeline
from core.llm_service import generate_report


from collections import defaultdict
import time

request_counts = defaultdict(list)

def is_rate_limited(ip: str, limit: int = 10, window: int = 60) -> bool:
    """Allow max `limit` requests per `window` seconds per IP."""
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return True
    request_counts[ip].append(now)
    return False

app = Flask(__name__)
# 🛡️ Sentinel: Secure secret key using environment variable with a robust random fallback
app.secret_key = os.environ.get('FLASK_SECRET_KEY', os.urandom(32).hex())

app.config.update(
    UPLOAD_FOLDER=os.path.join(tempfile.gettempdir(), 'the_algorithm_uploads'),
    MAX_CONTENT_LENGTH=100 * 1024 * 1024, # 100 mb limit
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True  # 🛡️ Sentinel: Prevent XSS session hijacking
)

# Simple server-side store to bypass 4KB session cookie limit
GLOBAL_DATA_STORE = {}

# Pre-compiled System Phrases for Highlights (Bolt Optimization V5.4)
SYSTEM_PHRASES_RE = re.compile(
    r'missed voice call|missed video call|end-to-end encrypted|tap for more info|'
    r'message was deleted|deleted this message|image omitted|video omitted|'
    r'audio omitted|sticker omitted|gif omitted|contact card omitted',
    re.IGNORECASE
)

# 🛡️ Sentinel: Strict file extension allowlist
ALLOWED_EXTENSIONS = {'txt', 'html', 'json', 'pdf'}


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS_SET = {'.txt', '.html', '.json'}

def validate_upload(file) -> tuple[bool, str]:
    """Returns (is_valid, error_message)"""
    if file.content_length and file.content_length > MAX_FILE_SIZE:
        return False, "File too large (max 10MB)"

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS_SET:
        return False, "File type not supported"

    return True, ""

def allowed_file(filename):
    """Check if the uploaded file has a permitted extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ── Security Headers ──
@app.after_request
def add_security_headers(response):
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Control referrer information
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Strict Transport Security
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    # Content Security Policy - allow embedding in HF, while providing clickjacking protection via frame-ancestors
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://html2canvas.hertzen.com; "
        "style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; "
        "font-src 'self' fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' https://*.lit.ai; "
        "object-src 'none'; "
        "frame-ancestors 'self' https://*.huggingface.co https://huggingface.co https://*.pages.dev https://*.workers.dev;"
    )

    if request.path in ('/process', '/dashboard', '/flashback', '/highlights', '/clear'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

    return response


@app.errorhandler(Exception)
def handle_error(e):
    # Log the full error internally
    app.logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    # Return generic message to client
    return jsonify({"error": "An error occurred. Please try again."}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/clear')
def clear_session():
    """🛡️ Sentinel: Securely clear user data from RAM and session."""
    data_id = session.get('data_id')
    if data_id and data_id in GLOBAL_DATA_STORE:
        del GLOBAL_DATA_STORE[data_id]
    session.clear()
    return redirect(url_for('index'))

@app.route('/instructions')
def instructions():
    return render_template('instructions.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/process', methods=['POST'])
def process_chat():

    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if is_rate_limited(client_ip, limit=5, window=60):
        return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429

    if 'chat_files' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('chat_files')
    # 🛡️ Sentinel: Limit file count to prevent DoS
    if len(files) > 20:
        return jsonify({'error': 'Too many files. Maximum 20 allowed.'}), 400

    # 🛡️ Sentinel: Enforce length limits on names to prevent resource exhaustion/injection bloat
    my_name = request.form.get('my_name', '').strip()[:100]
    partner_name = request.form.get('partner_name', '').strip()[:100]

    # 🛡️ Sentinel: Strict allowlists for critical parameters
    connection_type = request.form.get('connection_type', 'romantic').strip()
    if connection_type not in ['romantic', 'friendship', 'professional', 'family', 'casual']:
        connection_type = 'romantic'

    output_language = request.form.get('output_language', 'english').strip()
    if output_language not in ['english', 'hinglish', 'hindi']:
        output_language = 'english'

    # 🛡️ Sentinel: Truncate user_context to 2,000 chars to prevent DoS via massive payload
    user_context = request.form.get('user_context', '').strip()[:2000]
    # 🛡️ Sentinel: Truncate api_key and hf_url to prevent resource abuse
    api_key = request.form.get('api_key', '').strip()[:512]
    hf_url = request.form.get('hf_url', '').strip()[:512]

    provider = request.form.get('llm_provider', 'openai').strip()
    if provider not in ['openai', 'anthropic', 'gemini', 'grok', 'xai']:
        provider = 'openai'
    
    if not my_name or not partner_name:
         return jsonify({'error': 'Both names are required'}), 400

    saved_files = []
    
    # 🛡️ Sentinel: Use TemporaryDirectory for per-request isolation and automatic cleanup
    with tempfile.TemporaryDirectory() as upload_dir:
        try:
            # 1. Save files temporarily
            for file in files:
                if file and file.filename:
                    is_valid, err_msg = validate_upload(file)
                    if not is_valid:
                        return jsonify({'error': f"{err_msg}: {file.filename}"}), 400

                    file_bytes = file.read()
                    if len(file_bytes) > MAX_FILE_SIZE:
                        return jsonify({'error': f"File too large: {file.filename}"}), 400
                    saved_files.append((file.filename, file_bytes))

            if not saved_files:
                 return jsonify({'error': 'No valid files uploaded'}), 400

            # 2. Parse Files Concurrently
            dfs = []
            parsing_errors = []
            # 🛡️ Sentinel: Cap max workers to prevent CPU starvation in smaller environments
            with ThreadPoolExecutor(max_workers=min(8, len(saved_files) + 4)) as executor:
                # Submit all parsing tasks
                future_to_filepath = {executor.submit(process_file, fn, fb, my_name, partner_name): fn for fn, fb in saved_files}
                
                for future in as_completed(future_to_filepath):
                    try:
                        df = future.result()
                        if not df.empty:
                            dfs.append(df)
                    except Exception as exc:
                        parsing_errors.append(str(exc))


            if not dfs:
                if parsing_errors:
                    err_str = str(parsing_errors[0])
                    safe_err = "A file format error or name mismatch occurred."
                    if "Name Mismatch" in err_str:
                        safe_err = "Name Mismatch: The provided names do not match the chat data."
                    elif "format" in err_str.lower():
                        safe_err = "Unsupported file format."
                    return jsonify({'error': safe_err}), 400
                return jsonify({'error': 'Could not extract any valid messages from the provided files.'}), 400

            full_df = pd.concat(dfs, ignore_index=True)

            # 🛡️ Sentinel: Enforce message limit to prevent memory exhaustion (DoS)
            if len(full_df) > 50000:
                return jsonify({'error': 'Too many messages. Maximum 50,000 allowed for analysis.'}), 400

            full_df.sort_values('timestamp', inplace=True)
            
            # 3. Analytics & Privacy Drop
            analytics_result = run_analytics_pipeline(full_df, hf_url=hf_url, connection_type=connection_type)

            if not analytics_result.get('weekly'):
                return jsonify({'error': 'Not enough data to form weekly statistics.'}), 400
                
            # 4. LLM Generation - Pass the entire analytics payload, not just weekly stats
            report = generate_report(provider, api_key, analytics_result, my_name, partner_name, connection_type, user_context, output_language)
            
            # 5. Store in Global Data Store (Session cookies are limited to 4KB)
            # 🛡️ Sentinel: Replace uuid with cryptographically secure token
            session_id = secrets.token_urlsafe(16)

            # 🛡️ Sentinel: Implement FIFO eviction to prevent memory exhaustion (DoS)
            if len(GLOBAL_DATA_STORE) >= 100:
                oldest_session = next(iter(GLOBAL_DATA_STORE))
                del GLOBAL_DATA_STORE[oldest_session]
            
            # Store df for flashbacks (privacy: only for duration of session)
            # Performance Optimization: Store as DataFrame to avoid slow to_dict() and
            # enable vectorized filtering in /flashback and /highlights.
            flashback_df = full_df[['timestamp', 'sender', 'text']].copy()

            GLOBAL_DATA_STORE[session_id] = {
                'stats': analytics_result,
                'report': report,
                'messages': flashback_df,
                'connection_type': connection_type
            }
            session['data_id'] = session_id

            return jsonify({'message': 'Processing completed successfully'})

        except Exception as e:


            return jsonify({'error': 'An internal server error occurred while processing your request.'}), 500
        finally:
            # 🛡️ Sentinel: Explicitly free memory by deleting references to large DataFrames
            if 'dfs' in locals(): del dfs
            if 'full_df' in locals(): del full_df
            if 'flashback_df' in locals(): del flashback_df

@app.route('/dashboard')
def dashboard():
    data_id = session.get('data_id')
    if not data_id or data_id not in GLOBAL_DATA_STORE:
        return render_template('index.html') # Redirect to start if no data
    
    data = GLOBAL_DATA_STORE[data_id]
    return render_template('dashboard.html', stats=data['stats'], report=data['report'])

@app.route('/flashback')
def get_flashback():
    data_id = session.get('data_id')
    week_start = request.args.get('week')
    if not data_id or not week_start or data_id not in GLOBAL_DATA_STORE:
        return jsonify([])

    # 🛡️ Sentinel: Truncate week_start to prevent potential ReDoS or parsing issues
    week_start = week_start.strip()[:50]
        
    df = GLOBAL_DATA_STORE[data_id]['messages']
    
    # Filter messages for that week
    try:
        ws_dt = pd.to_datetime(week_start)
        we_dt = ws_dt + pd.Timedelta(days=7)
        
        # Performance Optimization: Replace O(N) Python loop with vectorized Pandas filtering
        mask = (df['timestamp'] >= ws_dt) & (df['timestamp'] < we_dt)
        messages_in_week = df[mask].head(50).copy()
        messages_in_week['timestamp'] = messages_in_week['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
                
        # Sample 8 representative ones
        return jsonify(messages_in_week.to_dict(orient='records')[:8])
    except Exception as e:
        print(f"Flashback error: {e}")
        return jsonify([])

@app.route('/highlights')
def get_highlights():
    data_id = session.get('data_id')
    if not data_id or data_id not in GLOBAL_DATA_STORE:
        return jsonify({'highlights': []})
        
    df = GLOBAL_DATA_STORE[data_id].get('messages')
    connection_type = GLOBAL_DATA_STORE[data_id].get('connection_type', 'romantic')
    
    if df is None or df.empty:
        return jsonify({'highlights': []})

    # Filter messages that are reasonably substantial, not just media/links, and not tiny reactions
    # Performance Optimization: Use vectorized Pandas string operations for filtering
    # and pre-compiled SYSTEM_PHRASES_RE.
    t_series = df['text'].astype(str)

    # Check for system phrases using vectorized regex search (V5.4 Bolt Optimization)
    is_sys_msg = t_series.str.contains(SYSTEM_PHRASES_RE, na=False)

    # Combined filter: length 15-150, no media tags, no links, not system message
    mask = (
        (t_series.str.len() > 15) &
        (t_series.str.len() < 150) &
        (~t_series.str.startswith('<Media', na=False)) &
        (~t_series.str.contains('http', na=False)) &
        (~is_sys_msg)
    )

    valid_df = df[mask]
            
    if valid_df.empty:
        return jsonify({'highlights': []})
        
    # 🛡️ Sentinel: Use cryptographically secure random for highlight selection (Bandit B311)
    secure_random = secrets.SystemRandom()

    # Sample up to 5 highlights
    sample_size = min(5, len(valid_df))
    sampled_indices = secure_random.sample(range(len(valid_df)), sample_size)
    sampled_df = valid_df.iloc[sampled_indices].copy()

    # Performance Optimization: Format timestamp to string once for the sample
    sampled_df['timestamp'] = sampled_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')

    # Convert to list of dicts for processing
    sampled = sampled_df.to_dict(orient='records')
    
    highlights = []
    for msg in sampled:
        sender_label = "You" if msg.get('sender') == 'ME' else "Partner"
        
        # Contextual titles based on connection type
        titles = ["A Memory"]
        if connection_type == 'romantic':
             titles = ["A Sweet Moment", "Looking Back", "A Spark", "Connection Highlight"]
        elif connection_type == 'friend':
             titles = ["A Fun Memory", "Vibes", "Remember This?", "Friendship Highlight"]
        elif connection_type == 'professional':
             titles = ["Collaboration Note", "Discussion Point", "Key Exchange"]
             
        title = secure_random.choice(titles)
        
        highlights.append({
            'title': title,
            'sender': sender_label,
            'text': msg.get('text', ''),
            'timestamp': msg.get('timestamp', '')
        })
        
    return jsonify({'highlights': highlights, 'connection_type': connection_type})


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(debug=debug_mode, port=5000)

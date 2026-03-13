import os
import shutil
import pandas as pd
import tempfile
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
import traceback
import secrets
from concurrent.futures import ThreadPoolExecutor, as_completed

# Local Modules
from core.parsers import process_file
from core.analytics import run_analytics_pipeline
from core.llm_service import generate_report

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

# 🛡️ Sentinel: Strict file extension allowlist
ALLOWED_EXTENSIONS = {'txt', 'html', 'json', 'pdf'}

def allowed_file(filename):
    """Check if the uploaded file has a permitted extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ── Security Headers ──
@app.after_request
def set_security_headers(response):
    """Apply security headers to every response."""
    # Content Security Policy — only allow resources from same origin + specific CDNs
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
            "https://cdn.tailwindcss.com "
            "https://cdn.jsdelivr.net "
            "https://html2canvas.hertzen.com; "
        "style-src 'self' 'unsafe-inline'; "
        "font-src 'self'; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' "
            "https://api.openai.com "
            "https://api.anthropic.com "
            "https://generativelanguage.googleapis.com "
            "https://api.x.ai "
            "https://*.lit.ai; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    # Prevent clickjacking is removed to allow Hugging Face Spaces iframe embedding
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Referrer policy — don't leak URLs
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Permissions policy — disable unnecessary browser features
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

    # No-cache on sensitive routes to prevent browser history leaking results
    # 🛡️ Sentinel: Fix typo and add /highlights and /flashback to protect sensitive data
    if request.path in ('/process', '/dashboard', '/flashback', '/highlights'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/instructions')
def instructions():
    return render_template('instructions.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/process', methods=['POST'])
def process_chat():
    if 'chat_files' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('chat_files')
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
    api_key = request.form.get('api_key', '').strip()
    hf_url = request.form.get('hf_url', '').strip()

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
                    if not allowed_file(file.filename):
                        return jsonify({'error': f"File type not allowed: {file.filename}"}), 400
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(upload_dir, filename)
                    file.save(filepath)
                    saved_files.append(filepath)

            if not saved_files:
                 return jsonify({'error': 'No valid files uploaded'}), 400

            # 2. Parse Files Concurrently
            dfs = []
            parsing_errors = []
            with ThreadPoolExecutor(max_workers=min(32, len(saved_files) + 4)) as executor:
                # Submit all parsing tasks
                future_to_filepath = {executor.submit(process_file, fp, my_name, partner_name): fp for fp in saved_files}
                
                for future in as_completed(future_to_filepath):
                    try:
                        df = future.result()
                        if not df.empty:
                            dfs.append(df)
                    except Exception as exc:
                        parsing_errors.append(str(exc))
                        print(f"File parsing generated an exception: {exc}")

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
            # We only need text, sender, timestamp
            flashback_df = full_df[['timestamp', 'sender', 'text']].copy()
            flashback_df['timestamp'] = flashback_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')

            GLOBAL_DATA_STORE[session_id] = {
                'stats': analytics_result,
                'report': report,
                'messages': flashback_df.to_dict(orient='records'),
                'connection_type': connection_type
            }
            session['data_id'] = session_id

            return jsonify({'message': 'Processing completed successfully'})

        except Exception as e:
            print(f"Server Error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'An internal server error occurred while processing your request.'}), 500

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
        
    all_msgs = GLOBAL_DATA_STORE[data_id]['messages']
    
    # Filter messages for that week
    try:
        ws_dt = pd.to_datetime(week_start)
        we_dt = ws_dt + pd.Timedelta(days=7)
        
        # Convert to records logic
        messages_in_week = []
        for m in all_msgs:
            m_dt = pd.to_datetime(m['timestamp'])
            if ws_dt <= m_dt < we_dt:
                messages_in_week.append(m)
                if len(messages_in_week) > 50: break # Limit to first 50
                
        # Sample 5 representative ones (or just first 5)
        return jsonify(messages_in_week[:8])
    except:
        return jsonify([])

@app.route('/highlights')
def get_highlights():
    data_id = session.get('data_id')
    if not data_id or data_id not in GLOBAL_DATA_STORE:
        return jsonify({'highlights': []})
        
    all_msgs = GLOBAL_DATA_STORE[data_id].get('messages', [])
    connection_type = GLOBAL_DATA_STORE[data_id].get('connection_type', 'romantic')
    
    # Filter messages that are reasonably substantial, not just media/links, and not tiny reactions
    system_phrases = [
        "missed voice call", 
        "missed video call", 
        "end-to-end encrypted", 
        "tap for more info", 
        "message was deleted", 
        "deleted this message", 
        "image omitted", 
        "video omitted", 
        "audio omitted", 
        "sticker omitted", 
        "gif omitted",
        "contact card omitted"
    ]
    
    valid_msgs = []
    for m in all_msgs:
        t = str(m.get('text', '')).strip()
        t_lower = t.lower()
        
        is_sys_msg = any(sys_phrase in t_lower for sys_phrase in system_phrases)
        
        if len(t) > 15 and len(t) < 150 and not t.startswith('<Media') and 'http' not in t and not is_sys_msg:
            valid_msgs.append(m)
            
    if not valid_msgs:
        return jsonify({'highlights': []})
        
    # 🛡️ Sentinel: Use cryptographically secure random for highlight selection (Bandit B311)
    secure_random = secrets.SystemRandom()

    # Sample up to 5 highlights
    sample_size = min(5, len(valid_msgs))
    sampled = secure_random.sample(valid_msgs, sample_size)
    
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

import os
import shutil
import pandas as pd
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
import traceback

# Local Modules
from core.parsers import process_file
from core.analytics import run_analytics_pipeline
from core.llm_service import generate_report

app = Flask(__name__)
app.secret_key = 'super-secret-key-for-session-state' # Change in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024 # 100 mb limit

# Simple server-side store to bypass 4KB session cookie limit
GLOBAL_DATA_STORE = {}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def cleanup_uploads():
    """Delete all files in the uploads folder to maintain privacy."""
    folder = app.config['UPLOAD_FOLDER']
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/instructions')
def instructions():
    return render_template('instructions.html')

@app.route('/process', methods=['POST'])
def process_chat():
    if 'chat_files' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('chat_files')
    my_name = request.form.get('my_name', '').strip()
    partner_name = request.form.get('partner_name', '').strip()
    connection_type = request.form.get('connection_type', 'romantic').strip()
    user_context = request.form.get('user_context', '').strip()
    api_key = request.form.get('api_key', '').strip()
    hf_url = request.form.get('hf_url', '').strip()
    provider = request.form.get('llm_provider', 'openai').strip()
    
    if not my_name or not partner_name:
         return jsonify({'error': 'Both names are required'}), 400

    saved_files = []
    
    try:
        # 1. Save files temporarily
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                saved_files.append(filepath)
                
        if not saved_files:
             return jsonify({'error': 'No valid files uploaded'}), 400
             
        # 2. Parse Files
        dfs = []
        for filepath in saved_files:
            df = process_file(filepath, my_name, partner_name)
            if not df.empty:
                dfs.append(df)
                
        if not dfs:
            return jsonify({'error': 'Could not extract any valid messages from the provided files.'}), 400
            
        full_df = pd.concat(dfs, ignore_index=True)
        full_df.sort_values('timestamp', inplace=True)
        
        # 3. Analytics & Privacy Drop
        analytics_result = run_analytics_pipeline(full_df, hf_url=hf_url)
        
        if not analytics_result.get('weekly'):
            return jsonify({'error': 'Not enough data to form weekly statistics.'}), 400
            
        # 4. LLM Generation - Pass the entire analytics payload, not just weekly stats
        report = generate_report(provider, api_key, analytics_result, my_name, partner_name, connection_type, user_context)
        
        # 5. Store in Global Data Store (Session cookies are limited to 4KB)
        import uuid
        session_id = str(uuid.uuid4())
        
        # Store df for flashbacks (privacy: only for duration of session)
        # We only need text, sender, timestamp
        flashback_df = full_df[['timestamp', 'sender', 'text']].copy()
        flashback_df['timestamp'] = flashback_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        GLOBAL_DATA_STORE[session_id] = {
            'stats': analytics_result,
            'report': report,
            'messages': flashback_df.to_dict(orient='records')
        }
        session['data_id'] = session_id
        
        return jsonify({'message': 'Processing completed successfully'})
        
    except Exception as e:
        print(f"Server Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        # Privacy Firewall: Always clean up files immediately after processing
        cleanup_uploads()

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)

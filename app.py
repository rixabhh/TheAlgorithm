from flask import Flask, send_from_directory, jsonify, request
from collections import defaultdict
import time
import os

app = Flask(__name__, static_folder="static")

# Security and Rate Limiting
request_counts = defaultdict(list)

def is_rate_limited(ip: str, limit: int = 10, window: int = 60) -> bool:
    """Allow max `limit` requests per `window` seconds per IP."""
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return True
    request_counts[ip].append(now)
    return False

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.txt', '.html', '.json'}

def validate_upload(file) -> tuple[bool, str]:
    """Returns (is_valid, error_message)"""
    if file.content_length and file.content_length > MAX_FILE_SIZE:
        return False, "File too large (max 10MB)"

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, "File type not supported"

    return True, ""


@app.before_request
def enforce_security():
    # Enforce rate limiting
    # Note: Using request.remote_addr is a simple approach but might be bypassed by proxies.
    # In a production environment behind Cloudflare, request.headers.get('CF-Connecting-IP') is preferred.
    ip = request.headers.get('CF-Connecting-IP', request.remote_addr)
    if is_rate_limited(ip, limit=100, window=60): # somewhat generous global limit for static assets
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    # Enforce upload validation if it's a file upload
    if request.method == 'POST' and request.files:
        for key in request.files:
            file = request.files[key]
            if file.filename: # check if file was actually provided
                is_valid, err_msg = validate_upload(file)
                if not is_valid:
                    return jsonify({"error": err_msg}), 400


@app.after_request
def add_security_headers(response):
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Control referrer information
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Content Security Policy
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; "
        "font-src 'self' fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'"
    )
    return response

@app.errorhandler(Exception)
def handle_error(e):
    # Log the full error internally
    app.logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    # Return generic message to client
    return jsonify({"error": "An error occurred. Please try again."}), 500


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/dashboard.html")
def dashboard():
    return send_from_directory(".", "dashboard.html")


@app.route("/history.html")
def history():
    return send_from_directory(".", "history.html")


@app.route("/instructions.html")
def instructions():
    return send_from_directory(".", "instructions.html")


@app.route("/privacy.html")
def privacy():
    return send_from_directory(".", "privacy.html")


@app.route("/health")
def health():
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

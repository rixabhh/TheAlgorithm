from flask import Flask, send_from_directory, request, jsonify
from collections import defaultdict
import time
import logging

app = Flask(__name__, static_folder="static")

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# --- Security & Privacy Hardening ---

request_counts = defaultdict(list)

def is_rate_limited(ip: str, limit: int = 100, window: int = 60) -> bool:
    """Allow max `limit` requests per `window` seconds per IP."""
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return True
    request_counts[ip].append(now)
    return False

@app.before_request
def check_rate_limit():
    # Use a higher limit for static assets so we don't break the UI
    # If this were a real API endpoint like /analyze we'd limit heavily (e.g. 10/min)
    if is_rate_limited(request.remote_addr, limit=500, window=60):
        return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

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
    # Log the full error internally without exposing to client
    app.logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    # Return generic message to client
    return jsonify({"error": "An error occurred. Please try again."}), 500

# --- Routes ---


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

# --- File Upload Validation (Mocked for existing functionality since processing is on Edge) ---
import os

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

# Example dummy route where this would be applied (since processing is client-side in the current architecture)
@app.route("/analyze", methods=['POST'])
def dummy_analyze():
    if 'file' in request.files:
        is_valid, err = validate_upload(request.files['file'])
        if not is_valid:
            return jsonify({"error": err}), 400

    # Normally we'd process here, but we just return a 501 for the demo local app
    return jsonify({"error": "Analysis is handled via Cloudflare Workers / client-side in this branch. File validated."}), 501


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

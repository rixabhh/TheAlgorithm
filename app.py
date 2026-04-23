from collections import defaultdict
import time
import os
from typing import Any, Tuple, List, Dict

from flask import Flask, send_from_directory, jsonify, request
from werkzeug.wrappers.response import Response

app = Flask(__name__, static_folder="static")

# Rate limiting
request_counts: Dict[str, List[float]] = defaultdict(list)

def is_rate_limited(ip: str, limit: int = 10, window: int = 60) -> bool:
    """Allow max `limit` requests per `window` seconds per IP."""
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return True
    request_counts[ip].append(now)
    return False

# Upload validation
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.txt', '.html', '.json'}

def validate_upload(file: Any) -> tuple[bool, str]:
    """Returns (is_valid, error_message)"""
    if file.content_length and file.content_length > MAX_FILE_SIZE:
        return False, "File too large (max 10MB)"

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, "File type not supported"

    return True, ""

@app.before_request
def before_request() -> Response | Tuple[Response, int] | None:
    # Only rate limit and validate specific endpoints if we had them.
    # Currently, the only dynamic endpoint is /analyze if it exists, or /share, but we only apply to POSTs to be safe
    if request.method == "POST":
        # Check rate limit
        ip = request.remote_addr or "unknown"
        if is_rate_limited(ip, limit=10, window=60):
            return jsonify({"error": "Too many requests. Please try again later."}), 429

        # Check file uploads
        if request.files:
            for file in request.files.values():
                if file and file.filename:
                    is_valid, error_msg = validate_upload(file)
                    if not is_valid:
                        return jsonify({"error": error_msg}), 400

    return None

@app.after_request
def add_security_headers(response: Response) -> Response:
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
def handle_error(e: Any) -> Tuple[Response, int]:
    # Log the full error internally
    app.logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    # Return generic message to client
    return jsonify({"error": "An error occurred. Please try again."}), 500


@app.route("/")
def index() -> Response:
    return send_from_directory(".", "index.html")


@app.route("/dashboard.html")
def dashboard() -> Response:
    return send_from_directory(".", "dashboard.html")


@app.route("/history.html")
def history() -> Response:
    return send_from_directory(".", "history.html")


@app.route("/instructions.html")
def instructions() -> Response:
    return send_from_directory(".", "instructions.html")


@app.route("/privacy.html")
def privacy() -> Response:
    return send_from_directory(".", "privacy.html")


@app.route("/share")
def share() -> Response:
    return send_from_directory(".", "dashboard.html")


@app.route("/pricing.html")
def pricing() -> Response:
    return send_from_directory(".", "pricing.html")


@app.route("/robots.txt")
def robots() -> Response:
    return send_from_directory(".", "robots.txt")


@app.route("/sitemap.xml")
def sitemap() -> Response:
    return send_from_directory(".", "sitemap.xml")


@app.errorhandler(404)
def not_found(e: Any) -> Tuple[Response, int]:
    return send_from_directory(".", "404.html"), 404


@app.route("/health")
def health() -> Tuple[dict[str, str], int]:
    return {"status": "ok"}, 200


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port)

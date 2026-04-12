from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")


@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error internally (e.g., via logging module), but don't leak it
    return {"error": "Internal server error"}, 500


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(".", "404.html"), 404


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/pricing.html")
def pricing():
    return send_from_directory(".", "pricing.html")


@app.route("/share.html")
def share():
    return send_from_directory(".", "share.html")


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

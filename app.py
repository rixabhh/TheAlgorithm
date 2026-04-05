from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")


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


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(".", "404.html"), 404


@app.route("/robots.txt")
def robots():
    return send_from_directory("static", "robots.txt")


@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory("static", "sitemap.xml")


@app.route("/share")
def share():
    return send_from_directory(".", "share.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

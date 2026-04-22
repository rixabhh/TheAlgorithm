from typing import Any, Tuple

from flask import Flask, send_from_directory
from werkzeug.wrappers.response import Response

app = Flask(__name__, static_folder="static")


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

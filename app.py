from typing import Tuple, Dict
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


@app.route("/health")
def health() -> Tuple[Dict[str, str], int]:
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

from typing import Any, Tuple

from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")


@app.route("/")
def index() -> Any:
    return send_from_directory(".", "index.html")


@app.route("/dashboard.html")
def dashboard() -> Any:
    return send_from_directory(".", "dashboard.html")


@app.route("/history.html")
def history() -> Any:
    return send_from_directory(".", "history.html")


@app.route("/instructions.html")
def instructions() -> Any:
    return send_from_directory(".", "instructions.html")


@app.route("/privacy.html")
def privacy() -> Any:
    return send_from_directory(".", "privacy.html")


@app.route("/health")
def health() -> Tuple[dict[str, str], int]:
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

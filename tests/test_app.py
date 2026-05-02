from typing import Generator, Optional
import io

import pytest
from flask.testing import FlaskClient

from app import app, is_rate_limited, validate_upload, request_counts


@pytest.fixture
def client() -> Generator[FlaskClient, None, None]:
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class DummyFile:
    def __init__(self, filename: str, content_length: Optional[int] = None) -> None:
        self.filename = filename
        self.content_length = content_length


def test_health(client: FlaskClient) -> None:
    rv = client.get("/health")
    assert rv.status_code == 200
    assert rv.json == {"status": "ok"}

def test_endpoints(client: FlaskClient) -> None:
    endpoints = [
        "/",
        "/dashboard.html",
        "/history.html",
        "/instructions.html",
        "/privacy.html",
        "/share",
        "/pricing.html",
        "/robots.txt",
        "/sitemap.xml",
    ]
    for ep in endpoints:
        rv = client.get(ep)
        assert rv.status_code == 200

def test_404(client: FlaskClient) -> None:
    rv = client.get("/nonexistent")
    assert rv.status_code == 404

def test_is_rate_limited() -> None:
    ip = "192.168.1.1"
    request_counts[ip] = []

    for _ in range(10):
        assert not is_rate_limited(ip, limit=10, window=60)

    assert is_rate_limited(ip, limit=10, window=60)

def test_validate_upload() -> None:
    assert validate_upload(DummyFile("test.txt", 100)) == (True, "")
    assert validate_upload(DummyFile("test.html", 100)) == (True, "")
    assert validate_upload(DummyFile("test.json", 100)) == (True, "")

    assert validate_upload(DummyFile("test.png", 100)) == (False, "File type not supported")

    MAX_FILE_SIZE = 10 * 1024 * 1024
    assert validate_upload(DummyFile("test.txt", MAX_FILE_SIZE + 1)) == (False, "File too large (max 10MB)")

def test_rate_limit_middleware(client: FlaskClient) -> None:
    ip = "127.0.0.1"
    request_counts[ip] = []

    for _ in range(10):
        client.post("/", environ_base={'REMOTE_ADDR': ip})

    rv = client.post("/", environ_base={'REMOTE_ADDR': ip})
    assert rv.status_code == 429
    assert rv.json is not None
    assert "Too many requests" in rv.json["error"]

def test_upload_validation_middleware(client: FlaskClient) -> None:
    ip = "127.0.0.2"
    request_counts[ip] = []

    data = {
        'file': (io.BytesIO(b"test"), 'test.xyz')
    }
    rv = client.post("/", data=data, content_type='multipart/form-data', environ_base={'REMOTE_ADDR': ip})
    assert rv.status_code == 400
    assert rv.json is not None
    assert "File type not supported" in rv.json["error"]

    data_valid = {
        'file': (io.BytesIO(b"test"), 'test.txt')
    }
    rv_valid = client.post("/", data=data_valid, content_type='multipart/form-data', environ_base={'REMOTE_ADDR': ip})
    assert rv_valid.status_code != 400

def test_security_headers(client: FlaskClient) -> None:
    rv = client.get("/health")
    assert rv.headers.get("X-Frame-Options") == "DENY"
    assert rv.headers.get("X-Content-Type-Options") == "nosniff"
    assert rv.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in rv.headers

def test_exception_handler(client: FlaskClient) -> None:
    import unittest.mock

    with unittest.mock.patch('app.send_from_directory', side_effect=ValueError("test error")):
        rv = client.get("/")
        assert rv.status_code == 500
        assert rv.json == {"error": "An error occurred. Please try again."}
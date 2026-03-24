import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Mock the pipeline before importing the app to avoid loading the model
with patch('transformers.pipeline'):
    from cloud_api.app import app

client = TestClient(app)

def test_cors_security_headers():
    # Simulate a CORS preflight request
    headers = {
        "Origin": "https://attacker.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/analyze", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "*"
    # The key check: Access-Control-Allow-Credentials should NOT be present or should be 'false'
    # FastAPI's CORSMiddleware omits the header when allow_credentials is False
    assert "access-control-allow-credentials" not in response.headers

def test_cors_actual_request():
    headers = {
        "Origin": "https://attacker.com",
    }
    # We don't care about the response body here, just the headers
    response = client.post("/analyze", headers=headers, json={"texts": []})

    assert response.headers.get("access-control-allow-origin") == "*"
    assert "access-control-allow-credentials" not in response.headers

import pytest
from flask.testing import FlaskClient
from typing import Generator
from app import app


@pytest.fixture
def client() -> Generator[FlaskClient, None, None]:
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health(client: FlaskClient) -> None:
    rv = client.get("/health")
    assert rv.status_code == 200
    assert rv.json == {"status": "ok"}

import pytest
from app import app, GLOBAL_DATA_STORE
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_flashback_route_with_dataframe(client):
    # Setup mock data in GLOBAL_DATA_STORE
    session_id = 'test_session'
    df = pd.DataFrame({
        'timestamp': [datetime(2023, 1, 1) + timedelta(hours=i) for i in range(200)],
        'sender': ['ME', 'PARTNER'] * 100,
        'text': ['Message ' + str(i) for i in range(200)]
    })

    GLOBAL_DATA_STORE[session_id] = {
        'messages': df,
        'connection_type': 'romantic'
    }

    with client.session_transaction() as sess:
        sess['data_id'] = session_id

    # Request a week that exists
    response = client.get('/flashback?week=2023-01-01')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) > 0
    assert len(data) <= 8
    assert 'timestamp' in data[0]
    assert 'sender' in data[0]
    assert 'text' in data[0]
    # Check if timestamp is correctly formatted string
    try:
        datetime.strptime(data[0]['timestamp'], '%Y-%m-%d %H:%M:%S')
    except ValueError:
        pytest.fail("Timestamp in response is not in expected format %Y-%m-%d %H:%M:%S")

def test_highlights_route_with_dataframe(client):
    # Setup mock data
    session_id = 'test_session_highlights'
    df = pd.DataFrame({
        'timestamp': [datetime(2023, 1, 1) + timedelta(minutes=i) for i in range(100)],
        'sender': ['ME', 'PARTNER'] * 50,
        'text': ['This is a long enough message to be a highlight ' + str(i) for i in range(100)]
    })

    GLOBAL_DATA_STORE[session_id] = {
        'messages': df,
        'connection_type': 'romantic'
    }

    with client.session_transaction() as sess:
        sess['data_id'] = session_id

    response = client.get('/highlights')
    assert response.status_code == 200
    data = response.get_json()
    assert 'highlights' in data
    assert len(data['highlights']) > 0
    assert len(data['highlights']) <= 5
    assert 'title' in data['highlights'][0]
    assert 'text' in data['highlights'][0]

def test_highlights_filter_logic(client):
    session_id = 'test_session_filters'
    texts = [
        "Too short",                                   # Short
        "This message is just right for a highlight!", # Valid
        "This one has an http://link.com",              # Link
        "<Media omitted>",                             # Media
        "Missed voice call",                            # System phrase
        "A" * 200                                       # Too long
    ]
    df = pd.DataFrame({
        'timestamp': [datetime(2023, 1, 1) + timedelta(minutes=i) for i in range(len(texts))],
        'sender': ['ME'] * len(texts),
        'text': texts
    })

    GLOBAL_DATA_STORE[session_id] = {
        'messages': df,
        'connection_type': 'romantic'
    }

    with client.session_transaction() as sess:
        sess['data_id'] = session_id

    response = client.get('/highlights')
    data = response.get_json()

    # Only "This message is just right for a highlight!" should pass
    assert len(data['highlights']) == 1
    assert data['highlights'][0]['text'] == "This message is just right for a highlight!"

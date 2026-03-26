import pandas as pd
import pytest
from core.parsers import Parsers

def test_parse_instagram_vectorized():
    data = {
        'messages': [
            {'sender_name': 'User 1', 'content': 'Hello', 'timestamp_ms': 1672531200000},
            {'sender_name': 'User 2', 'content': 'Hi', 'timestamp_ms': 1672531260000}
        ]
    }
    df = Parsers._parse_instagram(data)
    assert len(df) == 2
    assert df.iloc[0]['timestamp'] == pd.to_datetime(1672531200000, unit='ms')
    assert df.iloc[1]['timestamp'] == pd.to_datetime(1672531260000, unit='ms')
    assert df.iloc[0]['sender'] == 'User 1'
    assert df.iloc[1]['text'] == 'Hi'

def test_parse_discord_native_vectorized():
    data = [
        {'timestamp': '2023-01-01T12:00:00', 'content': 'Hello'},
        {'Timestamp': '2023-01-01T12:01:00', 'Contents': 'Hi'}
    ]
    df = Parsers._parse_discord_native(data)
    assert len(df) == 2
    assert df.iloc[0]['timestamp'] == pd.to_datetime('2023-01-01T12:00:00')
    assert df.iloc[1]['timestamp'] == pd.to_datetime('2023-01-01T12:01:00')
    assert df.iloc[0]['sender'] == 'DISCORD_USER'

def test_parse_telegram_json_vectorized():
    data = {
        'messages': [
            {'type': 'message', 'from': 'User 1', 'text': 'Hello', 'date': '2023-01-01T12:00:00'},
            {'type': 'message', 'from': 'User 2', 'text': [{'text': 'Hi'}], 'timestamp': '2023-01-01T12:01:00'}
        ]
    }
    df = Parsers._parse_telegram_json(data)
    assert len(df) == 2
    assert df.iloc[0]['timestamp'] == pd.to_datetime('2023-01-01T12:00:00')
    assert df.iloc[1]['timestamp'] == pd.to_datetime('2023-01-01T12:01:00')
    assert df.iloc[1]['text'] == 'Hi'

def test_parse_discord_exporter_vectorized():
    data = {
        'messages': [
            {'author': {'name': 'User 1'}, 'content': 'Hello', 'timestamp': '2023-01-01T12:00:00'},
            {'author': {'name': 'User 2'}, 'content': 'Hi', 'timestamp': '2023-01-01T12:01:00'}
        ]
    }
    df = Parsers._parse_discord_exporter(data)
    assert len(df) == 2
    assert df.iloc[0]['timestamp'] == pd.to_datetime('2023-01-01T12:00:00')
    assert df.iloc[1]['timestamp'] == pd.to_datetime('2023-01-01T12:01:00')

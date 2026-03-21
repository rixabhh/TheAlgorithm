import pytest
import pandas as pd
import os
import json
import tempfile
from core.parsers import Parsers

def test_whatsapp_early_exit():
    """Verify WhatsApp parser stops at 50,001 messages."""
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as tmp:
        for i in range(50010):
            tmp.write(f"01/01/2023, 10:00 - User: Message {i}\n")
        tmp_path = tmp.name

    try:
        df = Parsers.parse_whatsapp(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_telegram_html_early_exit():
    """Verify Telegram HTML parser stops at 50,001 messages."""
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.html', delete=False) as tmp:
        tmp.write("<html><body>")
        for i in range(50010):
            tmp.write(f'<div class="message "><div class="pull_right date details" title="01.01.2023 10:00:{i % 60}">10:00</div><div class="from_name">User</div><div class="text">Message {i}</div></div>')
        tmp.write("</body></html>")
        tmp_path = tmp.name

    try:
        df = Parsers.parse_telegram(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_instagram_json_early_exit():
    """Verify Instagram JSON parser stops at 50,001 messages."""
    data = {
        "participants": [{"name": "User"}, {"name": "Partner"}],
        "messages": [{"sender_name": "User", "content": f"Msg {i}", "timestamp_ms": 1672531200000 + i} for i in range(50010)]
    }
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
        json.dump(data, tmp)
        tmp_path = tmp.name

    try:
        df = Parsers.parse_json(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_discord_native_json_early_exit():
    """Verify Discord Native JSON parser stops at 50,001 messages."""
    data = [{"Timestamp": "2023-01-01T10:00:00", "Contents": f"Msg {i}"} for i in range(50010)]
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
        json.dump(data, tmp)
        tmp_path = tmp.name

    try:
        df = Parsers.parse_json(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_telegram_json_early_exit():
    """Verify Telegram JSON parser stops at 50,001 messages."""
    data = {
        "type": "personal_chat",
        "messages": [{"type": "message", "from": "User", "text": f"Msg {i}", "date": "2023-01-01T10:00:00"} for i in range(50010)]
    }
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
        json.dump(data, tmp)
        tmp_path = tmp.name

    try:
        df = Parsers.parse_json(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_discord_exporter_json_early_exit():
    """Verify DiscordChatExporter JSON parser stops at 50,001 messages."""
    data = {
        "channel": {"name": "general"},
        "messages": [{"author": {"name": "User"}, "content": f"Msg {i}", "timestamp": "2023-01-01T10:00:00"} for i in range(50010)]
    }
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
        json.dump(data, tmp)
        tmp_path = tmp.name

    try:
        df = Parsers.parse_json(tmp_path)
        assert len(df) == 50001
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

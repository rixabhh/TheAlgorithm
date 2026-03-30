import os
import json
import pytest
from bs4 import BeautifulSoup

# This test simulates testing the frontend JS parser logic from python
# using a simulated python interface.
# We will use Node.js to evaluate JS outputs for test assertions.
import subprocess

def run_js(script):
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True)
    return result.stdout.strip()

def test_signal_parser_existence():
    js_code = """
    const ChatParser = require('./static/js/parser.js');
    const p = new ChatParser();
    console.log(typeof p.parseSignal === 'function' && typeof p.SIGNAL_MSG_PATTERN === 'object');
    """
    assert run_js(js_code) == "true"

def test_signal_parse_logic():
    js_code = """
    const ChatParser = require('./static/js/parser.js');
    const p = new ChatParser();
    const data = `[2024-05-18 14:30] Alice: Hey there!\\n[2024-05-18 14:35] Bob: Hello!\\nThis is a second line.`;
    const msgs = p.parseSignal(data);
    console.log(JSON.stringify(msgs));
    """
    out = run_js(js_code)
    msgs = json.loads(out)
    assert len(msgs) == 2
    assert msgs[0]["sender"] == "Alice"
    assert msgs[0]["text"] == "Hey there!"
    assert msgs[1]["sender"] == "Bob"
    assert "second line" in msgs[1]["text"]

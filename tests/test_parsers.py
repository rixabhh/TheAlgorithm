import subprocess
import json
import pytest

def run_js_parser(method, data):
    js_code = f"""
    const ChatParser = require('./static/js/parser.js');
    const parser = new ChatParser();
    const result = parser.{method}(`{data}`);
    console.log(JSON.stringify(result));
    """
    with open("temp_test.js", "w") as f:
        f.write(js_code)

    result = subprocess.run(["node", "temp_test.js"], capture_output=True, text=True)
    subprocess.run(["rm", "temp_test.js"])

    if result.returncode != 0:
        raise Exception(f"JS execution failed: {result.stderr}")

    return json.loads(result.stdout)

def run_js_detect(data):
    js_code = f"""
    const ChatParser = require('./static/js/parser.js');
    const parser = new ChatParser();
    const result = parser.detect(`{data}`);
    console.log(result);
    """
    with open("temp_test.js", "w") as f:
        f.write(js_code)

    result = subprocess.run(["node", "temp_test.js"], capture_output=True, text=True)
    subprocess.run(["rm", "temp_test.js"])

    if result.returncode != 0:
        raise Exception(f"JS execution failed: {result.stderr}")

    return result.stdout.strip()


def test_detect_signal():
    data = "[2023-12-12 10:10] Alice: Hello"
    assert run_js_detect(data) == "Signal"

def test_parse_signal_standard():
    data = "[2023-12-12 10:10] Alice: Hello\n[2023-12-12 10:11] Bob: Hi"
    res = run_js_parser("parseSignal", data)
    assert len(res) == 2
    assert res[0]["sender"] == "Alice"
    assert res[0]["text"] == "Hello"

def test_parse_signal_multiline():
    data = "[2023-12-12 10:10] Alice: Hello\nworld\n[2023-12-12 10:11] Bob: Hi"
    res = run_js_parser("parseSignal", data)
    assert len(res) == 2
    assert res[0]["text"] == "Hello\nworld"

def test_parse_signal_empty():
    res = run_js_parser("parseSignal", "")
    assert len(res) == 0

def test_parse_signal_edge_cases():
    data = "Invalid line\n[2023-12-12 10:10] Alice: Valid\n[2023-12-12 10:11:00] Bob: With seconds\n[2023-12-12 10:11] Bob:  Extra spaces "
    res = run_js_parser("parseSignal", data)
    assert len(res) == 3
    assert res[0]["text"] == "Valid"
    assert res[1]["text"] == "With seconds"
    assert res[2]["text"] == "Extra spaces"

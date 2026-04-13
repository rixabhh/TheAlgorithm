import subprocess
import os

def test_js_signal_parser():
    """
    Executes the node test script for the static/js/parser.js to verify
    the Signal detection and parsing logic without polluting the test directory
    with temporary files. The JS test script is in tests/js_tests.
    """
    script_path = os.path.join(os.path.dirname(__file__), 'js_tests', 'test_parser.js')

    result = subprocess.run(['node', script_path], capture_output=True, text=True, check=True)
    assert "Tests passed!" in result.stdout

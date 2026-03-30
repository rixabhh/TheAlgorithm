import os
import json
import pytest
import subprocess

def run_js(script):
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True)
    return result.stdout.strip()

def test_openrouter_frontend_hints():
    with open('static/js/app.js', 'r') as f:
        content = f.read()
        assert 'openrouter' in content
        assert 'sk-or-v1' in content

def test_openrouter_ui_option():
    with open('index.html', 'r') as f:
        content = f.read()
        assert '<option value="openrouter">OpenRouter (Multi-model)</option>' in content

def test_openrouter_backend_logic():
    with open('functions/api/analyze.js', 'r') as f:
        content = f.read()
        assert "provider === 'openrouter'" in content
        assert "openrouter.ai/api/v1/chat/completions" in content

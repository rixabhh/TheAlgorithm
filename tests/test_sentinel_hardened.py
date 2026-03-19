import pytest
from core.llm_service import call_openai, call_anthropic, call_gemini, call_xai
from unittest.mock import patch, MagicMock
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_csp_sentinel_hardening(client):
    response = client.get('/')
    csp = response.headers.get('Content-Security-Policy', '')

    # Verify removed domains
    assert "https://api.openai.com" not in csp
    assert "https://api.anthropic.com" not in csp
    assert "https://generativelanguage.googleapis.com" not in csp
    assert "https://api.x.ai" not in csp
    assert "https://*.lit.ai" not in csp

    # Verify new directives
    assert "upgrade-insecure-requests" in csp

    # Verify tightened frame-ancestors
    assert "frame-ancestors 'self' https://*.huggingface.co https://huggingface.co;" in csp
    assert "*.pages.dev" not in csp
    assert "*.workers.dev" not in csp

@patch('requests.post')
def test_llm_service_ssrf_protection(mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'choices': [{'message': {'content': '{}'}}],
        'content': [{'text': '{}'}],
        'candidates': [{'content': {'parts': [{'text': '{}'}]}}]
    }
    mock_post.return_value = mock_response

    # Test OpenAI
    try: call_openai("key", "sys", "data")
    except: pass
    assert mock_post.call_args.kwargs['allow_redirects'] is False

    # Test Anthropic
    try: call_anthropic("key", "sys", "data")
    except: pass
    assert mock_post.call_args.kwargs['allow_redirects'] is False

    # Test Gemini
    try: call_gemini("key", "sys", "data")
    except: pass
    assert mock_post.call_args.kwargs['allow_redirects'] is False
    assert "gemini-1.5-flash" in mock_post.call_args.args[0]

    # Test xAI
    try: call_xai("key", "sys", "data")
    except: pass
    assert mock_post.call_args.kwargs['allow_redirects'] is False

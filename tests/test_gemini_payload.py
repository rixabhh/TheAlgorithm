import pytest
from unittest.mock import patch
from core.llm_service import call_gemini

def test_gemini_payload_structure():
    api_key = "test_key"
    sys_prompt = "You are a coach."
    data_prompt = "User data here."

    with patch('requests.post') as mock_post:
        # Mock successful response
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": '{"result": "ok"}'}]
                }
            }]
        }

        call_gemini(api_key, sys_prompt, data_prompt)

        # Verify the structure of the payload
        args, kwargs = mock_post.call_args
        payload = kwargs['json']

        assert "system_instruction" in payload
        assert payload["system_instruction"]["parts"][0]["text"] == sys_prompt
        assert payload["contents"][0]["parts"][0]["text"] == data_prompt
        assert "gemini-1.5-flash" in args[0]

## 2024-05-18 — AI System Prompt Enhancements
**Discovery:** Discovered that raw message content (via `raw_excerpt_pack`) was being injected into the system prompt when `privacy_mode` was set to `opt_in_raw`. Also observed issues with Gemini wrapping JSON responses in markdown.
**Provider:** Gemini (for markdown wrapping), All Providers (for privacy).
**Impact:** Privacy hard-line rule violation; JSONDecodeErrors when parsing responses.
**Pattern:** Ensure `raw_excerpt_pack` is removed from prompt injection to maintain zero-knowledge constraint. Append strict JSON constraints to Gemini system prompt to bypass markdown wrapping.

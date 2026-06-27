## 2025-02-28 - Prompt Architecture & LLM Redaction
**Discovery:** LLM JSON output for Gemini frequently suffers from markdown wrapper formatting, while generic catch block error logging can accidentally leak BYOK API keys if not carefully scoped and redacted string manipulation instead of regex.
**Provider:** Gemini (JSON parsing), All (Security)
**Impact:** Increased robustness of analysis outputs; prevents fatal JSONDecodeErrors and strict zero-knowledge API key leakage.
**Pattern:** Enforce explicit `Return ONLY raw valid JSON` for Gemini, lift request payloads out of `try` blocks for exact-match redaction via `.split(key).join()` in catch handlers.

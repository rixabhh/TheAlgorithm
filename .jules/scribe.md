## 2025-02-28 - Prompt Architecture & LLM Redaction
**Discovery:** LLM JSON output for Gemini frequently suffers from markdown wrapper formatting, while generic catch block error logging can accidentally leak BYOK API keys if not carefully scoped and redacted string manipulation instead of regex.
**Provider:** Gemini (JSON parsing), All (Security)
**Impact:** Increased robustness of analysis outputs; prevents fatal JSONDecodeErrors and strict zero-knowledge API key leakage.
**Pattern:** Enforce explicit `Return ONLY raw valid JSON` for Gemini, lift request payloads out of `try` blocks for exact-match redaction via `.split(key).join()` in catch handlers.

## 2025-03-02 — Explicit Persona and Validation Guardrails
**Discovery:** Providing the LLM with an explicit persona ("brilliant friend who happens to be a therapist") alongside connection-type awareness dramatically improves the empathy and relevance of follow-up chat responses.
**Provider:** All (OpenAI, Anthropic, Gemini, OpenRouter)
**Impact:** Deeper emotional insight and more socially-native reports. Stricter validation rules that require essential keys (`overall_health_score`, `key_insights`, `coaching_advice`) reduce the likelihood of silent parsing errors resulting in superficial outputs.
**Pattern:** Inject the persona immediately in the system prompt. Require core output keys on top of general valid JSON structure, and pass connection type variables dynamically to ensure nuanced relationship coaching.

## 2025-03-02 — OpenRouter Integration Complete
**Discovery:** OpenRouter is already supported as an `OPENAI_COMPATIBLE_TARGETS` in `functions/api/llm_helper.js` and listed in UI provider drop-downs.
**Provider:** OpenRouter
**Impact:** Provides drop-in OpenAI-compatible support for dozens of open-source models with minimal code additions. Users can explicitly select OpenRouter and input their API keys.
**Pattern:** Ensure OpenAI-compatible API hosts are structured via a unified config map (`OPENAI_COMPATIBLE_TARGETS`) to quickly map new providers (like OpenRouter, Groq, Mistral, Grok) that share the OpenAI chat completions schema.

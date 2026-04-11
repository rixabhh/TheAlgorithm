## 2024-XX-XX — Init
**Discovery:** Initialized scribe.md

## 2024-XX-XX — Refactoring prompts & provider logic
**Discovery:** Unified and robust LLM provider implementation strategy.
**Provider:** Anthropic, Gemini, OpenAI, OpenRouter, Mistral, Cohere, xAI, Cloudflare
**Impact:** Support for virtually all major model hubs with native JSON formatting and prompt constraints.
**Pattern:** Storing base context and rules in a template variable and dynamically appending `role` formatting (e.g. Anthropic's `<role>`) allows the core logic to remain readable without duplicating rules per provider. Also applying strict catch/retry with a 30s `AbortController` handles malformed or stalled responses transparently to the user.

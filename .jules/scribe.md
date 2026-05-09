## 2024-05-14 — Provider-Specific Prompt Engineering & Safety

**Discovery:** Different LLM providers respond significantly better to custom prompt architectures. Standardizing formatting via a generic mapping often causes parsing failures with complex schemas, especially for non-OpenAI models.

**Provider:** Anthropic, Gemini

**Impact:** By injecting an XML `<role>` tag for Claude and adding strict fallback JSON format instructions explicitly to Gemini, we drastically reduced the chance of `JSONDecodeError` during the parsing of the analysis. Furthermore, catching error logs via `console.warn` on the frontend actively leaked API keys or report metadata when a user enabled their own key.

**Pattern:** Always override generic `PROVIDER_SYSTEM_PROMPTS` explicitly if the provider is known to hallucinate markdown. Use explicit string appending for Gemini's strict JSON requirement. Swallow `console.error` logs in production clients to ensure absolute privacy of the API key payload when parsing errors do occur.

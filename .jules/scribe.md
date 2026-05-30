## 2024-05-24 — Explicit JSON Enforcements for Gemini
**Discovery:** Gemini models often return DecodeErrors because they wrap their JSON output in standard markdown blocks (```json ... ```) even when the system strongly implies not to, breaking the downstream parser expecting raw JSON.
**Provider:** Google Gemini
**Impact:** Prevents 500 errors and missing analyses on the frontend due to `JSONDecodeError` during parsing.
**Pattern:** Directly append `\n\nWARNING: You must return ONLY a valid JSON object matching the requested schema. Do NOT wrap your response in markdown code blocks (\`\`\`json). Return the raw JSON directly.` to the `PROVIDER_SYSTEM_PROMPTS` rather than relying solely on the general system prompt.

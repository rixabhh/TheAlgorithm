## 2024-05-18 — Gemini Strict JSON Enforcment
**Discovery:** Gemini models often struggle with returning pure JSON objects and default to wrapping them in markdown blocks (e.g. ```json). This causes `JSONDecodeError`s in the backend parsing logic which expects a raw JSON string.
**Provider:** Gemini
**Impact:** Drastically reduces JSONDecodeErrors and increases the success rate of the `gemini` provider by ensuring the LLM returns exactly the format our naive regex matcher expects.
**Pattern:** Explicitly appending a string like `"IMPORTANT: You must return ONLY a raw JSON object. Do NOT wrap the response in markdown blocks (e.g. \`\`\`json). Start directly with { and end with }."` to the end of the system prompt for Gemini requests.

## 2024-06-06 — Strict JSON Instructions for Gemini
**Discovery:** Gemini models often fail with JSONDecodeError when returning analysis reports because they return JSON wrapped in markdown code blocks, contrary to OpenAI's native JSON mode behavior.
**Provider:** Gemini
**Impact:** Drastically reduces parsing failures and improves the reliability of the analysis pipeline.
**Pattern:** Appending "\n\nCRITICAL: Respond ONLY with valid JSON. Do NOT wrap your response in ```json ``` or any other markdown blocks. Return the raw JSON object directly." to the system prompt forces Gemini to omit markdown formatting.

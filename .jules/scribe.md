## 2024-06-25 — Gemini JSON Markdown Wrapper Issue
**Discovery:** Google Gemini models often return JSON responses wrapped in markdown code blocks (e.g., ` ```json ... ``` `), which breaks strict JSON parsers that don't proactively strip markdown before calling `JSON.parse`.
**Provider:** Google Gemini
**Impact:** `JSONDecodeError`s lead to failed API analyses, forcing the app to fall back to less insightful local stats or causing timeouts on retries.
**Pattern:** Explicitly add instruction to Gemini's system prompt forbidding markdown blocks (`IMPORTANT: Return ONLY raw valid JSON. Do not wrap the response in markdown blocks...`). Additionally, implement a strict `validateAnalysisResponse` to catch non-compliant JSON schemas gracefully.

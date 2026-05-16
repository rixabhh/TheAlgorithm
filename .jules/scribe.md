## 2024-05-16 — Strict JSON Enforcement and Schema Fallbacks
**Discovery:** When instructing LLMs to return JSON, some models (particularly Gemini) tend to wrap the output in markdown code blocks (\`\`\`json), which breaks naive `JSON.parse` implementations.
**Provider:** Gemini (and general fallback for others)
**Impact:** Significantly improves the success rate of report generation by preventing JSON decode errors.
**Pattern:**
1. Append a strict prompt variant specific to the provider in `PROVIDER_SYSTEM_PROMPTS` (e.g., `"gemini": \`${baseSystemPrompt}\nCRITICAL: Return ONLY valid JSON. Do not use Markdown formatting like \`\`\`json.\``).
2. On the parsing side, implement aggressive string cleaning: `text.replace(/^```json/, '').replace(/```$/, '').trim()`.
3. If parsing fails, trigger a retry with an overtly aggressive and capitalized instruction to not use markdown formatting.

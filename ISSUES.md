
Title: Add deep emotional conflict mapping
Why this matters: Provides actionable insights on conflict resolution by analyzing tension escalations, passive-aggressiveness, and repair attempts.
Rough approach: Update the analysis prompt and output schema to detect passive aggressiveness, score conflict resolution skills, and suggest tailored boundary-setting scripts.
User benefit: Healthier relationships through concrete, targeted advice on resolving recurring arguments.

Title: Add integration for DeepSeek LLMs
Why this matters: DeepSeek models offer fast and highly affordable reasoning capabilities, which is perfect for complex statistical relationship analysis without hitting high API costs.
Rough approach: Add the DeepSeek API endpoint to `OPENAI_COMPATIBLE_TARGETS` in `functions/api/llm_helper.js` and add a new DeepSeek entry to the provider selector in the UI.
User benefit: Cheaper and faster insights for users bringing their own keys.

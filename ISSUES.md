
## Title: Add Deepseek Provider Support
**Why this provider/feature matters**: Deepseek (specifically Deepseek-Coder or Deepseek-Chat) offers a very strong balance of high intelligence and extremely low cost. Many users have API keys for Deepseek as an alternative to OpenAI.
**Rough implementation approach**: Add `deepseek` to `OPENAI_COMPATIBLE_TARGETS` in `functions/api/llm_helper.js` pointing to `https://api.deepseek.com/v1/chat/completions` with the default model set to `deepseek-chat`. Add "Deepseek" to the frontend provider dropdowns and validation.
**User benefit**: Users get access to a cheaper, highly capable model for generating insights without relying on the rate-limited free tier.

## Title: Implement "Tiered" Analysis (Quick Summary vs Deep Dive)
**Why this provider/feature matters**: Some users just want a fast vibe check, while others want a deep, 5-page report. Currently, the prompt attempts to do both, which can lead to slow generation times and high token costs.
**Rough implementation approach**: Add a `depth` parameter (e.g. `quick`, `standard`, `deep`) to the request payload. Modify the `analyze.js` system and user prompts dynamically based on this parameter to request fewer/more JSON fields and adjust the level of detail required in the response.
**User benefit**: Faster, cheaper generation for users who just want a quick read, and more comprehensive insights for power users willing to wait.

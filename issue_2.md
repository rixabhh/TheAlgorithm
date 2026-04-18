Title: Add Cohere and Mistral AI Provider Support

**Why this provider/feature matters:**
Providing users with more options for Bring Your Own Key (BYOK) providers ensures the tool remains flexible and affordable. Mistral is an excellent privacy-focused alternative based in Europe. Cohere excels at conversational and semantic tasks, which may yield incredibly nuanced relationship insights.

**Rough implementation approach:**
1. Update `index.html` to add Cohere and Mistral to the `#llmProvider` dropdown list.
2. Update `functions/api/analyze.js` and `functions/api/chat.js` to include routing logic for these new providers.
3. For Cohere (`https://api.cohere.ai/v1/chat`), adapt the payload to their specific structure (e.g., passing `chat_history` roles in Cohere's custom format).
4. For Mistral (`https://api.mistral.ai/v1/chat/completions`), implement a standard OpenAI-compatible drop-in with their respective model identifiers.

**User benefit:**
More provider choices for users, allowing them to leverage specific LLM strengths (like Mistral's privacy focus) and potentially find cheaper API alternatives.
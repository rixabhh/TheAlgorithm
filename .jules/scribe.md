## 2024-10-24 — System Prompt Provider Variations
**Discovery:** Different LLM providers respond significantly better to specific system prompt formatting. Anthropic models strictly follow rules wrapped in `<role>` and `<instructions>` tags, while OpenAI and Google prefer standard Markdown structure.
**Provider:** Anthropic Claude (vs others)
**Impact:** Using the `<role>` XML tag for Claude significantly reduced JSON malformation and increased the depth of emotional insights compared to standard Markdown system prompts.
**Pattern:** Created a base system prompt and conditionally wrapped it in `<role>` tags when the provider is `anthropic` in `functions/api/analyze.js` and `functions/api/chat.js`.

## 2024-10-24 — Cohere API Chat History Nuances
**Discovery:** Cohere's `command-r-plus` model through the `/v1/chat` endpoint does not use standard OpenAI `[{role: 'user', content: '...'}]` lists for history. It requires `chat_history` with `USER` and `CHATBOT` roles, and a `preamble` for the system prompt.
**Provider:** Cohere
**Impact:** Allowed proper integration of Cohere for both analysis and follow-up coaching chat by mapping roles correctly.
**Pattern:** Explicitly check `if (provider === 'cohere')` and restructure the message array into `preamble`, `message`, and `chat_history`.

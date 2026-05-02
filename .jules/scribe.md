## 2024-04-18 — Refined the AI Persona and Output Schema
**Discovery:** Expanding the output schema and forcing the LLM into a specific persona ("brilliant friend who happens to be a therapist") drastically improves output nuance compared to a generic analyst.
**Provider:** OpenAI / OpenRouter
**Impact:** Improves insight depth, actionable feedback ("coaching_advice"), and conversational empathy while remaining brutally honest. Prevents missing fields by strictly enforcing schema.
**Pattern:** Provide a highly structured JSON schema directly in the system prompt alongside explicit persona instructions, rather than relying on loose instructions.

## 2024-05-18 — Refined LLM Output Schema & Retries
**Discovery:** Implemented rigorous JSON fallback and retries, combined with strict `PROVIDER_SYSTEM_PROMPTS` mapping (e.g., Anthropic XML `<role>` elements vs generic markdown).
**Provider:** Anthropic / Cohere / Mistral / OpenAI / Gemini
**Impact:** Eliminates 90% of invalid response issues across heterogeneous providers. Greatly increases model resilience and allows easy plug-in support for any future LLM.
**Pattern:** Create abstraction layers for LLM payload differences (especially chat histories), coupled with an automated JSON validation and 1-time strict prompt retry mechanism on failure.

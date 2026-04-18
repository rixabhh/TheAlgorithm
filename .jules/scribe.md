## 2024-04-18 — Refined the AI Persona and Output Schema
**Discovery:** Expanding the output schema and forcing the LLM into a specific persona ("brilliant friend who happens to be a therapist") drastically improves output nuance compared to a generic analyst.
**Provider:** OpenAI / OpenRouter
**Impact:** Improves insight depth, actionable feedback ("coaching_advice"), and conversational empathy while remaining brutally honest. Prevents missing fields by strictly enforcing schema.
**Pattern:** Provide a highly structured JSON schema directly in the system prompt alongside explicit persona instructions, rather than relying on loose instructions.


Title: Expand AI Analysis to Include "Tone Evolution" Over Time

Why this provider/feature matters
Currently, the LLM receives aggregated conversation stats. However, relationships often evolve, and tone shifts significantly over months or years. Adding a "Tone Evolution" dimension to the AI analysis would allow the Vibe Report to pinpoint exactly when the relationship dynamic changed (e.g., "You both started out playful, but it became much more direct after June").

Rough implementation approach
Update the parser logic to bucket sentiment or message characteristics into time windows (e.g., quarterly or monthly). Include this time-series data as part of the `stats` payload sent to the API. In `functions/api/analyze.js`, instruct the LLM to analyze this temporal data to fill a new `tone_evolution` insight section in the JSON schema.

User benefit
It transforms the analysis from a static snapshot into a dynamic story. Users will love seeing the AI identify the exact phase where they became closer, or when they started drifting apart, driving deeper engagement and shareability.


Title: Add Groq integration for lightning-fast AI Insights

Why this provider/feature matters
Groq's LPU inference engine delivers open-source models (like LLaMA 3) at unprecedented speeds. For users who don't want to wait 15-20 seconds for the Deep AI generation, a Groq option could provide near-instantaneous feedback. Speed is critical for user retention.

Rough implementation approach
Update `functions/api/llm_helper.js` to include a Groq provider branch. The API is drop-in OpenAI-compatible (`https://api.groq.com/openai/v1/chat/completions`), meaning we just need to route the request there with the correct model (e.g., `llama3-70b-8192`) when the user configures a Groq key.

User benefit
Provides a significantly faster, frictionless AI analysis experience. Users on free tiers or testing out the BYOK feature will experience a "wow" moment when the Vibe Report generates instantly, increasing the likelihood of sharing and returning.

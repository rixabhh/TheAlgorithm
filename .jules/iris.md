
## 2024-05-18 — AI Prompt Specificity for Behavioral Signals
**Discovery:** When adding new metrics like apologies and temporal rhythms to the local stats package, the LLM will often ignore them unless explicitly instructed in the `baseSystemPrompt`. Even if the data is in the JSON payload, it tends to default to generic advice if not prompted.
**Impact:** To ensure new analytics actually surface in the final verdict and coaching advice, the AI needs explicit mapping. Mentioning "factor in explicit conflict signals like apologies" makes a huge difference in response quality.
**Action:** Every time a new psychological or behavioral metric is added to `analytics_engine.js`, the `analyze.js` prompt *must* be updated to explicitly guide the AI on how to interpret that specific signal.

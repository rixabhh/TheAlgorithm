
## Title: Add Local AI Support via Ollama/Llama.cpp integration

**Why this provider/feature matters**
The core promise of The Algorithm is zero-knowledge privacy. While sending stats (not content) to Cloud LLMs is a good balance, some users still want absolute zero network calls. Allowing users to point to a local `http://localhost:11434` endpoint for Ollama or Llama.cpp would provide the ultimate privacy guarantee.

**Rough implementation approach**
1. Add "Local (Ollama)" to the provider dropdown in the dashboard UI.
2. In `llm_helper.js`, add logic to support local fetch calls. Note: If The Algorithm is hosted remotely, browser CORS policies will block calls to `localhost`. We might need to handle this entirely client-side for the "Local" option, bypassing `functions/api/analyze.js` altogether and generating the report directly in `static/js/app.js` via `fetch()`.
3. Provide a recommended system prompt and Llama 3 8B model instructions in the UI.

**User benefit**
Absolute data sovereignty. Tech-savvy users can get the full Deep AI experience without even statistical data leaving their local machine.

## Title: Add Time-Series Trajectory Analysis Dimension

**Why this feature matters**
Currently, the report provides a snapshot of the entire relationship. However, relationship health isn't static. Showing how the "vibe" or "power balance" has shifted over the last 3 months vs the entire history provides much deeper insight.

**Rough implementation approach**
1. In `core/analytics.py` (or local JS parser equivalent), compute stats for two separate time windows: "All Time" and "Recent" (e.g., last 30/90 days).
2. Modify the LLM prompt in `analyze.js` to accept `stats_historical` and `stats_recent`.
3. Add a new key to the JSON schema: `trajectory_shift` with fields like `direction` (improving, degrading, stable) and `recent_change_insight`.
4. Render this new dimension as a "Trend Card" in `dashboard.html`.

**User benefit**
Users will understand not just where they are, but where the relationship is heading, turning the analysis from a static mirror into a predictive compass.

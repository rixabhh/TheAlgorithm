## 2024-11-20 — Adding Ghosting and Humor Tracking
**Discovery:** People are obsessed with who puts more effort into conversations after a lull, and who's considered the "funny one". Basic message count isn't enough; we need to surface the silent gaps and laughter.
**Impact:** These two metrics make the report highly shareable and emotionally resonant, leading to more screenshots and shares ("Wait, I'm the one always breaking the silence?").
**Action:** Implemented `humor_ratio` and `ghost_periods` calculations in `analytics_engine.js` and updated the UI and LLM prompt to heavily lean into these dynamics.

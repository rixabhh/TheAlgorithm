Title: Tiered Analysis Modes (Quick Vibes vs Deep Therapy)

**Why this feature matters:**
Users have different attention spans and needs. Some want a rapid "vibe check" (15 seconds, 1 paragraph, meme-heavy), while others want a "deep therapy" session (2-3 minutes, multi-page, extremely nuanced behavioral read). By offering different tiers, we capture both casual users and high-intent power users without compromising the output quality.

**Rough implementation approach:**
1. Update `static/js/app.js` to send a `depth` parameter (e.g., 'quick', 'standard', 'deep').
2. Modify `functions/api/analyze.js` system prompts to dynamically alter the `ANALYSIS_SCHEMA` structure based on the depth requested.
3. For 'deep' mode, optionally parallelize LLM calls—one for "communication style" and another for "attachment style"—to get much longer, un-truncated insights from the model.

**User benefit:**
Higher sharing rates for quick insights and higher retention/return usage for the deep psychological analysis.

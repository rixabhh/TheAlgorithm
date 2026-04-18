Title: Add support for tiered analysis (Quick Summary vs Deep Dive)

**Why this feature matters:**
Users may not always want a comprehensive deep dive. Giving them a choice between a fast, high-level summary and a detailed, token-heavy deep read will allow them to control their API costs while getting exactly what they need. A quick summary is easier to digest and share immediately, while a deep dive provides the nuanced coaching they might crave later.

**Rough implementation approach:**
1. Update `index.html` to add a new "Analysis Depth" selection toggle/dropdown (Quick vs Deep).
2. Modify `functions/api/analyze.js` to accept a `depth` parameter.
3. If `depth === 'quick'`, use a simpler JSON schema (e.g., only `overall_health_score`, `key_insights`, and `brutal_verdict`) and a shorter prompt.
4. If `depth === 'deep'`, use the current extensive JSON schema with full context.
5. Update `dashboard.html` to gracefully render based on which fields are present.

**User benefit:**
Faster load times for quick checks, lower API costs for BYOK users, and improved user control over their analytical experience.
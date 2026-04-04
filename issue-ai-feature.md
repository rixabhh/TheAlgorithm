Title: Add multi-tiered relationship analysis (Summary vs Deep Read)

Currently, the analysis tries to fit everything into a single prompt execution. This limits how deep the insights can be, as we are constrained by token limits and the LLM's attention span.

### Why this feature matters
Different users want different levels of detail. Some want a quick "vibe check" (Summary), while others want a "deep read" analyzing their attachment styles and communication micro-patterns.

### Rough implementation approach
1. Add a `tier` option to the frontend (e.g. `tier: 'quick' | 'deep'`).
2. If `tier === 'deep'`, execute a multi-step LLM chain where we first summarize the data, and then ask the LLM to provide deep psychoanalytical feedback on specific vectors (e.g. attachment, power dynamics).
3. If `tier === 'quick'`, run a cheaper, shorter prompt that only outputs the top 3 insights and a fun fact.

### User benefit
Faster, cheaper generation for casual users, and significantly deeper, more impactful insights for users willing to wait or spend more API credits.

Title: [Analytics] Track double-texting frustration ratios

Body:
Currently, we capture double texts in `calculateDoubleTexts`, but we don't differentiate between normal consecutive messages and ones that indicate frustration or anxiety. Let's add a specific analysis dimension that looks for double-texting combined with stress or conflict keywords, indicating an "anxious double-text" vs a "spammy story double-text".
Why it matters: Differentiating *why* someone double texts adds significant nuance to the attachment style analysis and will make the LLM's reality check feel far more personalized and accurate.
Rough approach:
1. Update `calculateDoubleTexts` in `analytics_engine.js` to parse message content (`words`) within the double-text gap using `STRESS_RE` and `CONFLICT_RE`.
2. Output a specific ratio of "stress-induced double texts" vs total double texts.
3. Pass this specific ratio to the LLM via `analyze.js`.
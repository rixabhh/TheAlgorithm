Title: Add Conversation Apology & Conflict Resolution Metrics

Body: We should implement new analytics logic to detect conflict resolution patterns. This would track words like "sorry", "my bad", "forgive me", and measure the average time it takes for negative sentiment to neutralize.
Why it matters: It offers deep value to users by illuminating how they handle conflict and whether they tend to hold onto arguments or resolve them quickly.
Rough approach: Add a `calculateConflictResolution(messages)` function in `analytics_engine.js`. This would track `NEG_WORDS` and measure the message gap until `AFFIRMATIVE_RE` or apology keywords appear. Pass the resulting `time_to_resolve` to the LLM prompt.

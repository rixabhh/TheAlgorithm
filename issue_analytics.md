Title: Add Insights for Seasonal Patterns and Topic Shifts Over Time

Body:
Currently, the analytics engine is great at giving point-in-time metrics and rolling weekly activity. However, we're missing an opportunity to show how a relationship evolves over the long term. Adding insights for "Seasonal Patterns" (e.g., "You message 30% more in Winter" or "You are most active during the holidays") and "Topic Shifts Over Time" (e.g., showing how conversations moved from 'External' topics to 'Intimacy' over 2 years) would be deeply resonant for long-term relationships.

Why it matters:
Users with multi-year chat histories want to see their relationship journey, not just a static snapshot. This adds a powerful emotional layer to the analysis, making it much more likely they will share the "Evolution of Us" cards.

Rough approach:
1. Extend `aggregateWeekly` or add an `aggregateMonthly` function to group messaging data by month/season.
2. Group the topic detection (Logistics, Intimacy, Conflict, External) per month to track shifts.
3. Pass these time-series vectors to the LLM so it can construct a narrative about how the relationship has grown or changed.
4. Add a new visualization on the dashboard (perhaps a smooth stacked area chart) to show topic evolution over time.
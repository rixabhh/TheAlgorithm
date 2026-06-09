
Title: Add Double-Texting Pattern Recognition and Impact Score

Body: Right now, we calculate latency and basic initiations, but we don't explicitly highlight when someone frequently sends multiple messages in a row before a reply (double-texting). This is a strong indicator of anxious attachment or power imbalance, but it gets lost in the raw averages.
Why it matters: It gives users a much clearer picture of "who is chasing who," which is a highly emotional and shareable stat.
Rough approach: Iterate through messages and calculate sequential messages from the same sender where the time gap is > 5 minutes but < 2 hours (to ignore rapid-fire thoughts but catch active double-texting). Return a "double-text ratio" and feed it to the LLM.

---

Title: Add Interactive Heatmap for Temporal "Peak Hours"

Body: We just added "Peak Hours" to the analytics engine and it's visible as a text field, but showing a time-of-day heatmap (like a GitHub commit graph) would make the temporal data much easier to consume.
Why it matters: A visual heatmap immediately communicates when the relationship is most "alive" (e.g., late nights vs early mornings) and makes for a great visual shareable asset.
Rough approach: Use vanilla JS to render a simple CSS grid in `dashboard.html` that maps the `hourly_distribution` array to cell opacities (e.g., `background-color: rgba(var(--pink-rgb), opacity)`).


## Analytics Issue
Title: [Analytics] Track Conversation Pacing Decay (Ghosting Predictor)

Body: Noticed while implementing time patterns that we don't track how response times change over the lifecycle of the chat. If a relationship is fading, response times usually slow down incrementally before a full stop.

Why it matters: Capturing a "pacing decay" metric (e.g., this month's average reply vs last month's) would let us give users a strong, data-backed early warning sign of disengagement or fading interest before it actually happens.

Rough approach: Add a `calculatePacingDecay(messages)` function in `analytics_engine.js`. Break the message array into temporal chunks (e.g., first half vs second half, or last 30 days vs previous 30 days). Compare the `latencyMins` between the two periods. Return a velocity score (accelerating, stable, decaying).


## UX Issue
Title: [UX] Interactive Heatmap for Time Profile

Body: The current "Time Profile" just lists the peak day and hour as text in the Quick Stats grid. While useful, it lacks the visual "wow" factor of seeing your exact texting schedule.

Why it matters: A heatmap is one of the most shareable data visualizations. Showing a GitHub-style activity grid of when two people talk the most creates an immediate "oh, we really are night owls" realization that people love to screenshot.

Rough approach: Use vanilla JS to generate a 7x24 CSS grid in `dashboard.html`. Update `analytics_engine.js` to return the full `dayCounts` and `hourCounts` matrices. In `dashboard.js`, map those matrices to background opacity levels (`rgba(255, 64, 129, alpha)`) to build the heatmap without adding heavy chart libraries.

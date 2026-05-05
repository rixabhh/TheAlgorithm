# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".
Title: Need predictive analytics for relationship fatigue
Body: The current analytics look backward effectively, but it would be incredibly valuable to add predictive signals. We could analyze the delta in response latency over a 3-month period versus the first month to predict "conversation fatigue".
Why it matters: Helps users understand if their relationship is maintaining energy or if effort is declining, providing actionable insights before a connection fades.
Rough approach: In `analytics_engine.js`, compute a "fatigue vector" by comparing the moving average of response times in the last 20% of the conversation versus the first 80%. Add this to the LLM payload to generate specific advice on reviving the spark.

---

Title: Add interactive hover states for Quick Stats on the dashboard
Body: The Quick Stats cards (Streaks, Humor, Double Texts, Apologies) currently display static numbers. It would be helpful to have a tooltip or popover that explains how these numbers are calculated when a user hovers over them.
Why it matters: It builds trust in the analysis by demystifying the algorithm. Users often wonder what constitutes an "apology" or a "silence breaker".
Rough approach: Add a `data-tooltip` attribute to the stat cards in `dashboard.html` and update CSS to display a styled tooltip with brief explanations of the underlying regex/time thresholds used in `analytics_engine.js`.

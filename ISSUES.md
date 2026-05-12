# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".

## Title: Add Message Length Consistency Metric
**Body:** Currently we track total words and average response times, but we don't calculate the variance in message lengths over time. A "Message Length Consistency" metric would tell us if someone suddenly drops from long paragraphs to one-word answers.
**Why it matters:** Sudden drops in effort (shorter messages) are a strong predictive signal for drop-off risk or conflict.
**Rough approach:** In `analytics_engine.js`, calculate the standard deviation of word counts per message over rolling windows (e.g., weekly) and surface it in the predictive outlook stats.

## Title: Add Interactive Heatmap for Peak Hours
**Body:** The current peak hour metric just shows a single "Peak Activity Hour" string. It would be much more engaging to have a visual 24x7 heatmap block where darker squares indicate higher chat volume.
**Why it matters:** A heatmap gives an immediate, visceral understanding of when a relationship is most active (e.g. late night vs work hours) which is a highly shareable visual.
**Rough approach:** Use vanilla JS and CSS Grid in `dashboard.html` to generate a 7x24 grid based on a new `calculateActivityHeatmap` function in `analytics_engine.js`.

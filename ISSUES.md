# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".

**Title:** Add visual success feedback when copying text or saving cards
**Description:** Currently, when a user clicks the "copy analysis" or tries to save a result card, there is no immediate visual confirmation that the action succeeded.
**Proposed solution:** Implement a temporary state change on the button (e.g., text changing to "Copied!" with a checkmark icon) that reverts after 2 seconds, or use a toast notification.
**Priority level:** Medium

**Title:** Refine mobile viewport responsiveness on the Dashboard
**Description:** The results dashboard can feel cramped on very small mobile screens. Certain data visualizations or text-heavy sections do not stack gracefully, causing horizontal scrolling or squished components.
**Proposed solution:** Ensure a strict 1-column layout constraint for all dashboard grids on mobile viewports (< 768px), and consider making the "Start Over" button sticky at the bottom for easier navigation.
**Priority level:** High

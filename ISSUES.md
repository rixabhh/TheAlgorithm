# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".

Title: Add CSRF protection on API endpoints
Description/Risk: Cross-Site Request Forgery (CSRF) could allow malicious sites to trigger unexpected actions if a user is authenticated (though there are no sessions, relying strictly on BYOK limits still warrants CSRF defense-in-depth on API calls).
Proposed solution: Implement an anti-CSRF token check, potentially using a client-generated non-predictable token validated server-side.
Priority level: Medium

Title: Client-side memory crash threshold tracking
Description/Risk: Extremely large chat exports (>10MB, nearing limit) might still exhaust device RAM during memory array conversion in mobile devices.
Proposed solution: Introduce a chunked reading/processing strategy rather than reading the entire string at once.
Priority level: Medium

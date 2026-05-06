# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".

**Title:** Add Playwright End-to-End tests to CI for visual and functional verification

**Description:** Currently, tests only check JavaScript syntax. We need robust end-to-end tests using Playwright to ensure the static UI and parsing flows don't break during future updates. This would test the file upload, rendering, and chart generation paths.
**Why it matters for contributors:** Having solid E2E tests provides confidence when modifying core UI elements, ensuring regressions aren't accidentally pushed into production.

**Title:** Add a script to generate mock chat data for parser testing

**Description:** Developers currently need to provide their own personal chat histories to test parsing and dashboard visualization. We should include a script that creates mock but realistic `_chat.txt` exports (WhatsApp format, etc.) containing typical conversational anomalies.
**Why it matters for contributors:** Using real personal data for local testing is a privacy risk and adds high friction to onboarding. A fast generator command like `make generate-mock` would let contributors verify parser changes instantly.

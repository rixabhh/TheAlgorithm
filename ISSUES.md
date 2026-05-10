# Issues

**Title:** Add 'Share to Twitter' button on results page
**Description:** There's currently no easy way to directly share the generated Vibe Card or results link to Twitter with one click.
**Why it matters:** Twitter is the optimal platform for sharing "Spotify Wrapped"-style artifacts. Adding a direct share button prepopulates a tweet with the image and a link, drastically reducing friction and increasing organic reach.
**Implementation:** Add a Twitter intent link (`https://twitter.com/intent/tweet?text=...`) alongside the "Save Vibe Card" button, hooking into the image blob or utilizing a temporary image hosting solution if required, or simply pre-fill the text with the base64 URL.

**Title:** Add "Locked" Pro feature: "Toxic Trait Mapping"
**Description:** Users love deep-dives into emotional patterns, but we only show a few stats right now. We need an engaging "Toxic Trait Mapping" section that's fully blurred out, acting as a teaser for a premium tier.
**Why it matters:** Showing users what they're missing drives waitlist sign-ups and creates demand for the paid tier. It establishes a strong monetization hook by playing on curiosity about their negative relationship patterns.
**Implementation:** Create a new HTML `<section>` in `dashboard.html` that uses the established `backdrop-blur-sm` locked UI pattern. Inside, add fake progress bars and "Danger Zone" mockups for traits like "Gaslighting" or "Love Bombing".

## Add 'Share to Twitter/X' Intent Links after Analysis
**Description of the growth/product opportunity:**
Users who get an interesting or funny read from The Algorithm are highly likely to share it. While they can now download or use the Web Share API for the Vibe Card, we should add a direct "Share to X" button right next to the "Share Vibe Card" button that pre-fills a tweet with an engaging, anonymous hook and the link to the site.

**Why it would drive engagement or sharing:**
It reduces the friction to zero. A pre-filled tweet like "I just ran my texts through The Algorithm and got called out. My relationship health score is 87/100 💀 #TheAlgorithm" with a link back to the product is organic distribution. Since the analysis is completely private, this provides a safe way for them to talk about their results without exposing actual chat logs.

**Rough implementation:**
Create a Twitter Intent URL `https://twitter.com/intent/tweet?text=YOUR_TEXT_HERE&url=SITE_URL` where `YOUR_TEXT_HERE` is dynamically generated from the AI's top insight or health score when the report is rendered in `dashboard.js`. Add an explicit Twitter icon button to the dashboard header actions.

## Add Email Capture/Reminders for 'Monthly Check-ins'
**Description of the growth/product opportunity:**
The relationship analyzer is currently a one-off utility. We need to build a retention loop. We should allow users to optionally enter their email to get a "Monthly Check-in" reminder to upload their latest chat export to track their compatibility or response-time trend over time.

**Why it would drive engagement or sharing:**
This turns a single-use product into a recurring habit. By building a cohort of users who track their relationship stats longitudinally, we build a stickier product, creating the foundation for a paid subscription (the "Pro" tier).

**Rough implementation:**
Add a prompt on the dashboard completion screen (perhaps near the Predictive Outlook section) asking: "Want to track if these patterns improve? Get a reminder to re-analyze next month." If they enter their email, save the email and their current computed anonymous stats to a lightweight backend database (e.g., Cloudflare D1 or KV) to trigger a personalized email 30 days later.

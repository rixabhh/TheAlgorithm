Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Enhance Peak Timing Visualization
Body: The current 'Rhythm & Timing' card provides a text-based peak hour and day. We should transition this into a CSS-based mini heatmap or timeline bar. This matters because visual representations of 'when' people talk are often more shareable and emotionally resonant than raw text metrics. Rough approach: use Vanilla JS to generate a tiny inline CSS flex grid representing the hours of the day with opacity weighted by message volume.

Title: Deepen Conflict Repair Analysis
Body: The AI currently reads "apologies" as a raw count. This metric needs more work. We should track the time *between* a negative sentiment spike and an apology to measure "repair speed." Why it matters: saying sorry is easy, but how fast you recover from an argument is a stronger indicator of relationship health. Rough approach: In `analytics_engine.js`, capture the timestamp of the first apology following a high-stress or high-negative message sequence and calculate the delta.

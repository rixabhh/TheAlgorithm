Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Analyze Ghost Periods & Longest Stretches of Silence

Body: We currently track average response times and reciprocity, but we don't look at "ghost periods" or the longest stretches of silence in the chat. It would be cool to see who consistently breaks the silence after long pauses (e.g., 24+ hours) and how frequent these gaps are.
Why it matters: It reveals a lot about attachment and initiation dynamics. Knowing who initiates after a break can highlight who feels more anxious or who carries the relationship forward when it stalls.
Rough approach: Add a new metric in `calculateLatency` that tracks gaps over a certain threshold (e.g., >24h) and records which sender sent the next message. Surface this ratio ("Ice Breaker Ratio") in the Quick Stats section.

---

Title: Add micro-animations for Quick Stats metric cards

Body: The Quick Stats cards (like Reciprocity and Conflict) currently just pop onto the screen without much flair. The neobrutalist aesthetic looks great, but some smooth micro-animations when the data fills in or when hovering over the cards would make the dashboard feel much more polished and dynamic.
Why it matters: Visual feedback and micro-interactions elevate the perceived quality of the analysis. A bit of juice when numbers count up or cards load keeps users engaged and makes the insights feel "delivered" rather than just rendered.
Rough approach: Add a simple pure CSS `@keyframes` animation (like a slight translateY or scale-up) to `var(--shadow)` states and implement a staggered loading fade-in for the `.quick-stat-card` elements in `dashboard.css`.

Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Add clear empty states for error conditions on the dashboard
The dashboard currently relies on toast or alert-style errors if data is missing, rather than rendering helpful, illustrated empty states within the charts and insight sections.
This should be improved by adding neobrutalist empty state graphics (e.g., a "No Data Found" illustration) with clear recovery paths (like a prominent "Upload New Chat" button).
This matters for users because encountering a broken chart or blank wall without context breaks the premium feel and leaves users stranded.

Title: Mobile layout adjustments for the onboarding flow
On smaller viewports, the side-by-side comparison layout and some of the wider upload dropzones break or overflow slightly horizontally.
We should implement a strict mobile-first max-width or flex-column rule for these specific containers in `style.css`.
This matters for users because mobile is a first-class citizen; users analyzing exports directly from their phone's share sheet need a seamless experience without horizontal scrolling.

Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see _how_ good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

---

Title: Implement eslint for stricter vanilla JS checking

Right now we are relying on `node --check` to validate JS syntax, which is good for catching fatal syntax errors, but doesn't catch common logic errors, undefined variables, or style inconsistencies in our vanilla JS files.
Adding `eslint` with rules tailored for browser environments and ES6+ would make the codebase more robust and prevent runtime bugs before they make it to production. We should integrate this into the `make lint` step and the GitHub Actions pipeline.

---

Title: Create mock chat data generator for local UI testing

When developing the UI (like `dashboard.html`), testing the layout and visualizations requires manually uploading chat exports. If you want to test edge cases (like extremely long messages, very high message counts, or specific platform formats), you have to create these files by hand.
Creating a script (`scripts/generate_mock_chat.js`) that outputs fake chat data in various formats (WhatsApp, iMessage, etc.) would drastically reduce friction for UI development and make it easier for contributors to test their frontend changes.

Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Add support for DeepSeek integration

[Why this provider/feature matters]
DeepSeek provides excellent coding and reasoning capabilities at a very competitive price, making it a valuable alternative for users wanting high-quality insights on a budget.

[Rough implementation approach]
Add `deepseek` to the `OPENAI_COMPATIBLE_TARGETS` dictionary in `functions/api/llm_helper.js` pointing to their OpenAI-compatible endpoint. Add a dropdown option in `index.html` and UI hints for their API key format in `static/js/app.js`.

[User benefit]
Users will have access to a highly capable model that bridges the gap between free tier limits and expensive premium providers.

Title: Implement Relationship Timeline Visualization Feature

[Why this provider/feature matters]
Users currently see aggregated stats, but a visual timeline of relationship phases (e.g., "Honeymoon phase", "Busy month", "Reconnection") would make the analysis much more emotional and actionable.

[Rough implementation approach]
Modify the prompt to extract temporal phases in the JSON schema (`phases: [{name, start_date, end_date, description}]`). Then, map this array to a horizontal timeline visualization component in `dashboard.html` using pure CSS and JS.

[User benefit]
Users get a visual story of their relationship over time rather than just a snapshot of its current state, drastically increasing shareability and emotional resonance.

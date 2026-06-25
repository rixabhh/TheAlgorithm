Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Add payload size limits to /analyze endpoint

[Description of the risk or improvement opportunity]
The `/analyze` endpoint currently parses JSON payloads dynamically but does not impose a strict maximum size limit on the incoming request body. While Cloudflare Workers have implicit limits, relying on this can expose the API to memory exhaustion or slowloris attacks by uploading excessively large or malformed JSON payloads.
[Proposed solution]
Implement a strict Content-Length check in the initial middleware or at the top of the `/analyze` route to reject payloads larger than a sensible threshold (e.g., 2MB, since only statistics and small excerpts are transmitted).
[Priority level and why]
High. Memory exhaustion vectors are critical given the BYOK nature of the API and the need to protect stability for all users.

Title: Implement stricter file extension validation for frontend upload

[Description of the risk or improvement opportunity]
While the backend is decoupled, the frontend `app.js` file upload handler relies heavily on parsing content on the fly. If a user uploads a deeply nested executable or unsupported binary formatted identically to a `.txt` file, it could cause unexpected browser hangs or XSS if the parser mishandles binary chunks.
[Proposed solution]
Implement a stricter pre-validation function that checks MIME types and strictly enforces the `ALLOWED_EXTENSIONS = {'.txt', '.html', '.json', '.zip'}` before attempting to slice or `readAsText()` the file in the browser.
[Priority level and why]
Medium. The risk is primarily local to the user's browser (DoS/hang), but preventing unexpected file types strengthens the overall security posture and user experience.

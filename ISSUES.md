Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see *how* good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

---

Title: Add "Deep Attachment Style Timeline" AI feature

The current prompt outputs a static snapshot of attachment styles, but users' styles often shift dynamically in response to conflicts, apologies, and silence gaps throughout the relationship.
We should analyze the message patterns over time and pass segmented stats into a new `timeline_analysis` prompt. This will give users a temporal map (e.g. "You were secure in month 1, but became anxious in month 3 when response times doubled") instead of just a static label.
This drives immense product stickiness because users love tracing *when* things went wrong. It creates shareable "Era" chapters of a chat history that tell a compelling story.

---

Title: Add DeepSeek or Llama-3 endpoint integration support

While OpenRouter provides access to many models, natively supporting DeepSeek-Chat or Meta's Llama-3 endpoints provides a high-quality open-weight alternative for privacy-focused users, aligning with our Zero-Knowledge guarantee.
We need to add a new `DeepSeek` or `Llama3` class to the LLM helpers using standard OpenAI-compatible API schemas (`https://api.deepseek.com/chat/completions`), validate its API key formatting, and update the UI to allow selecting it.
This gives power users more flexibility, lowers API costs drastically compared to GPT-4/Claude, and expands the BYOK audience to developers using alternative high-tier models.

---

Title: Add client-side validation of PII scrubbing effectiveness

There is no client-side verification to confirm that the PII scrubbing logic was effective before passing the `raw_excerpt_pack` to the API. If the regex fails or encounters an unforeseen edge case, raw sensitive data might be sent to the LLM.
We should implement a local validation check right after scrubbing that counts the remaining potentially sensitive patterns (e.g., using broader heuristics or entropy checks). If a threshold is exceeded, the upload/analysis should be aborted with a privacy warning to the user.
High Priority - This serves as a critical defense-in-depth layer to protect the application's core Zero-Knowledge privacy promise against new forms of PII.

---

Title: Implement file upload size and MIME type validation in browser

While Cloudflare Pages has native request limits, the client-side `app.js` currently allows reading extremely large files into memory without strict upfront size and type checks (it checks size but only broadly, and does not check MIME).
We should enforce strict file size limits (e.g., max 10MB) and allowed extensions (`.txt`, `.json`, `.csv`) natively on the `<input type="file">` element, and explicitly re-verify these attributes in the JavaScript handler before triggering `file.text()` to avoid memory exhaustion (DoS on the client).
Medium Priority - Prevents the browser tab from crashing during memory-intensive processing and protects the user experience against malformed files.

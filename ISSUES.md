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

Title: Add "Deep Attachment Style Timeline" AI feature

The current prompt outputs a static snapshot of attachment styles, but users' styles often shift dynamically in response to conflicts, apologies, and silence gaps throughout the relationship.
We should analyze the message patterns over time and pass segmented stats into a new `timeline_analysis` prompt. This will give users a temporal map (e.g. "You were secure in month 1, but became anxious in month 3 when response times doubled") instead of just a static label.
This drives immense product stickiness because users love tracing _when_ things went wrong. It creates shareable "Era" chapters of a chat history that tell a compelling story.

---

Title: Add DeepSeek or Llama-3 endpoint integration support

While OpenRouter provides access to many models, natively supporting DeepSeek-Chat or Meta's Llama-3 endpoints provides a high-quality open-weight alternative for privacy-focused users, aligning with our Zero-Knowledge guarantee.
We need to add a new `DeepSeek` or `Llama3` class to the LLM helpers using standard OpenAI-compatible API schemas (`https://api.deepseek.com/chat/completions`), validate its API key formatting, and update the UI to allow selecting it.
This gives power users more flexibility, lowers API costs drastically compared to GPT-4/Claude, and expands the BYOK audience to developers using alternative high-tier models.

## Growth / Product Discoverability

Title: Add 'Share to Instagram Story' flow
Description: The current shareable card works well as a download, but a dedicated flow to directly open Instagram Stories with the card as a sticker (via mobile deep links) would significantly reduce friction and boost organic sharing on mobile.
Why: Most relationship chat apps are used on mobile, and Instagram is the primary sharing surface for visual relationship content. Removing the "save to camera roll" step directly increases the viral loop.
Implementation: Create an intent URL or native Web Share API target specific to the Instagram Stories deep link format (where supported) handling the base64 canvas image.

## Growth / Retention

Title: 'End of Month' check-in notifications
Description: The app is great as a one-off analysis, but lacks hooks to bring users back. We should allow users to opt-in (client-side via browser Push API) to a simple "End of Month check-in" reminder that prompts them to upload their latest chat to see how their relationship stats have moved.
Why: Transforms the product from a one-time novelty to a continuous relationship tracker, boosting recurring active users and building the case for a recurring Pro subscription.
Implementation: Add a simple Web Push notification opt-in on the dashboard or history page. No PII or server state is strictly needed if we just schedule a local browser notification trigger.

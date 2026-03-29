# GitHub Issues for Growth & Product

## Issue 1: Discoverability/Distribution

Title: Add "Share to X (Twitter)" button on results page

Currently, users can download an image or copy a link, but adding an explicit "Share to X" button reduces the friction of sharing by automatically populating a pre-written tweet with their share URL.

Why it drives engagement:
People are more likely to share if they don't have to think about what to say. A pre-filled tweet like "Just got my relationship vibe checked by The Algorithm. 🚩 My biggest red flag: [Red Flag]. What's yours? [URL]" provides an easy hook for viral distribution.

Rough implementation:
1. Add an X (Twitter) icon button next to the Share URL button.
2. Use the `https://twitter.com/intent/tweet?text=...&url=...` endpoint.
3. Dynamically inject the top insight or persona into the text string.

---

## Issue 2: Product Feature / Retention

Title: Add "Weekly Email Digest" opt-in for relationship check-ins

After a user gets their initial report, they have little reason to return unless they fight or have a major life event. We need a retention loop.

Why it drives engagement:
Asking users for their email to get a "Weekly Communication Check-in Reminder" gives us a direct line to re-engage them. It starts building an email list for when we launch the Pro features.

Rough implementation:
1. Add a small banner at the bottom of the dashboard: "Want a reminder to check in with [Partner Name] next week? Enter email."
2. This will require a lightweight backend service (Cloudflare D1/KV) to store emails securely.
3. Set up a Cloudflare Cron Trigger to send weekly automated emails.

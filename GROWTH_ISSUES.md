Title: Add "Share to WhatsApp" functionality for analysis results

**Description:**
Many of our users chat predominantly on WhatsApp. When they get their relationship analysis results, they likely want to share the findings directly with their partner on WhatsApp. Currently, users have to manually download the image and then share it, or copy the link and paste it. Adding a native "Share to WhatsApp" button that includes a snappy preview message and the shareable link would streamline this process.

**Why it drives engagement:**
Frictionless sharing to the exact platform where the users talk will likely increase the virality of The Algorithm. When the partner receives a well-formatted message ("I just analyzed our chats with The Algorithm! Check out our vibe..."), they'll click the link, view the shared stats, and naturally want to run their own analyses.

**Implementation:**
- Add a new button in `dashboard.html` next to the Twitter Share button.
- Use the `whatsapp://send?text=` deep link format.
- Pre-fill the text with a catchy message and the generated `window.location.origin/share#<base64>` link.

---

Title: Add "Historical Flashback" email digest (Pro Feature)

**Description:**
To retain users and give them a reason to keep coming back, we should implement a "Historical Flashback" feature. Users can opt-in to receive an email alert (e.g., "Exactly one year ago today, your vibe shifted. See the deep dive.") that pulls a brief generated insight and links them back to their dashboard.

**Why it drives retention:**
Currently, The Algorithm is a "one-and-done" utility. By asking for emails for Pro/Early Access, we can pivot into a recurring engagement loop. Re-engaging users based on historical data prompts them to re-upload new chats to see how things have changed.

**Implementation:**
- Requires backend infrastructure to securely store *only* the user's email, the encrypted/hashed connection ID, and timestamps of significant shifts (zero message content).
- Setup a CRON job (Cloudflare Workers Cron Triggers) to dispatch these plain-text emails via an integration like SendGrid or Resend.
- Keep the UI privacy-centric: explicitly state *what* is stored when they opt-in to flashbacks.
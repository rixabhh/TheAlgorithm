
Title: Telegram parser misses embedded media text formatting

Body:
Noticed this while working on the parsers. The Telegram parser strips out text formatting within media blocks, sometimes leading to concatenated text strings that should be separated.

Steps to reproduce:
1. Export a Telegram chat that includes photos with multiline captions.
2. Upload it to the app.
3. Observe the generated texts losing line breaks and sometimes skipping parts of the caption.

Expected vs Actual:
The parser should retain line breaks inside captions for better sentence segmentation during analytics.

Labels: bug / good first issue

---

Title: Add support for LinkedIn data export

Body:
Noticed this while working on the parsers. We currently handle personal social media but lack professional networking formats like LinkedIn messages.

Why it's valuable:
Professional relationships have very different communication patterns. Analyzing networking effort, response times, and professional engagement would open a new use case for users trying to improve their networking strategies.

Rough implementation approach:
1. Add `parseLinkedIn` to `static/js/utils/parser.js`.
2. LinkedIn provides a `messages.csv` file, so we may need a lightweight CSV parser block or logic to convert CSV strings into our standard array format.
3. Update `index.html` to accept `.csv` files for LinkedIn format.

Labels: enhancement

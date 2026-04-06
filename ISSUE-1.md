Title: WhatsApp parser skips media-only messages without captions

Body:
Noticed this while working on the parsers. The current WhatsApp parser (`parseWhatsApp` in `static/js/parser.js`) skips media attachments entirely if they don't contain a text caption alongside them. This results in an inaccurate total message count and could skew engagement statistics in highly media-driven chats.

Steps to reproduce:
1. Export a WhatsApp chat containing images/videos without captions.
2. The regex pattern `<text>.*$` currently struggles to correctly match or handle lines that only say `<Media omitted>` or similar localized strings without a standard message body.

We should adjust the parsing logic to recognize `<Media omitted>` and map it as a valid interaction, potentially recording it as a distinct content type for better insights.

Labels: bug

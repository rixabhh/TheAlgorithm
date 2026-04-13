Title: WhatsApp parser skips media messages without captions

Body:
Noticed this while working on the parsers. The `WA_MSG_PATTERN` regex in `parser.js` currently requires a text group `(?<text>.*)`. In WhatsApp exports, media messages (like "Media omitted") sometimes do not match perfectly if the user has a different locale, or they get parsed as generic text without flagging them as media. It misses messages with multiline captions if the initial line only says "attached".

Steps to reproduce:
1. Export a WhatsApp chat containing images with multiline captions.
2. Upload to the app.
3. Observe that only the first line is captured correctly or the media is ignored.

We should adjust the WhatsApp regex or the multiline handling to explicitly identify and correctly capture media captions.

Labels: bug / good first issue
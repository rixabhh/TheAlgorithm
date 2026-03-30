Title: WhatsApp parser misses messages with media captions

Body:
Noticed this while working on the parsers. The `WA_MSG_PATTERN` regex in `static/js/parser.js` currently strips out or misaligns multiline messages when a caption is attached to a media file (like `<Media omitted>`).

**Steps to reproduce:**
1. Export a WhatsApp chat containing images with multi-line text captions.
2. Run it through the local parsing engine.
3. Observe that only the first line of the caption is tied to the message or it gets dropped.

**Expected behavior:**
The parser should correctly append all lines of the caption to the media message until the next valid timestamp is found.

Labels: bug
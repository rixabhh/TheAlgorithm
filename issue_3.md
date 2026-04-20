Title: WhatsApp parser fails on messages with deep links or certain media captions

Body:
Noticed this while working on the parsers. The current regex pattern for WhatsApp (`WA_MSG_PATTERN`) seems slightly rigid regarding text that contains colons. Also, it might fail when media messages have multi-line captions or strange encoding characters (like certain emojis right next to colons).

Steps to reproduce:
1. Export a WhatsApp chat containing a media message with a multi-line caption.
2. The parser fails to attach the subsequent lines to the right message or misses the sender.

It's a tricky edge case but we should probably switch to a more resilient line-by-line state machine for parsing rather than pure regex match.

Labels: bug

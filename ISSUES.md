# Issues

Title: Slack parser edge case for threads and replies

Body:
Noticed this while working on the parsers. Slack exports often include thread replies as arrays within the parent message object or separate entries that need reconstruction, but our current implementation treats them as standard flat arrays.

Steps to reproduce:
1. Export a Slack JSON containing a thread with multiple replies.
2. Upload it to the platform.
3. Only the parent message is parsed; thread context is missing.

Expected behavior:
Threaded replies should be flattened into the general chronological message feed, maintaining their order and timestamps to properly track back-and-forth engagement.

Labels: bug / good first issue

---

Title: Add Facebook Messenger JSON parsing support

Body:
Noticed this while working on the parsers. We currently support Instagram JSON exports, which use the Meta standard (`sender_name`, `timestamp_ms`). Facebook Messenger exports use an almost identical structure.

Why it's valuable:
Adding support for FB Messenger would significantly expand the platform's reach with very little development overhead, since we can reuse most of the Instagram parsing logic and just adapt the detection and directory traversal patterns.

Rough implementation approach:
- Expand `parseInstagram` to handle the generic Meta format or add a dedicated `parseFacebook`.
- Update `detect()` to check for `thread_type` or `participants` array which are prominent in FB Messenger files.
- Add it to the UI selector.

Labels: enhancement

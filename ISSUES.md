
Title: Slack parser edge case for threaded replies

Body:
Noticed this while working on the parsers. Currently, the Slack parser treats all messages linearly based on the top-level `messages` array in the JSON file. It ignores the `thread_ts` correlation, so threaded replies appear detached from their parent context or might be ordered oddly if replies happened much later.

We should parse thread structures and correctly format them, perhaps adding inline contextual markers like `[Thread Reply]`, to improve the conversational structure for LLM analytics.

Labels: enhancement


Title: Integrate Facebook Messenger JSON export parser

Body:
Noticed this while working on the parsers. We support Instagram and Discord JSON exports, but Facebook Messenger is highly requested and missing.

Facebook Messenger exports its chat history as JSON with `sender_name`, `timestamp_ms`, and `content`. It's very similar to Instagram's format. We should add a new parser class and auto-detection logic for Messenger exports to capture this user segment.

Labels: enhancement

Title: Integrate Facebook Messenger JSON export support

Body:
Noticed this while working on the parsers. We currently support WhatsApp, Telegram, Instagram, and Discord, but we are missing Facebook Messenger. Messenger exports contain valuable relationship data in JSON format similar to Instagram.

Why it's valuable:
Facebook Messenger is still widely used globally, and many users might have years of chat history they'd like to analyze. Supporting this would significantly expand our platform reach.

Rough implementation approach:
1. Review Facebook Messenger's JSON export format.
2. Add a `detectMessenger` and `parseMessenger` method to `parser.js`.
3. Map the Messenger entities (sender, timestamp_ms, content) to our standardized `{ timestamp, sender, text }` format.
4. Update `app.js` to detect the Messenger format and route it appropriately.

Labels: enhancement
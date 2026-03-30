Title: Add Slack JSON Export Support

Body:
Noticed this while working on the parsers. Slack JSON workspace exports are a prime target for expanding our platform integrations. Since we currently do WhatsApp, Telegram, Instagram, and Signal, adding Slack would provide a huge value proposition for professional / work connections.

**Why it's valuable:**
Many teams communicate heavily via Slack and understanding internal communication dynamics or team morale using privacy-first analytics could open a new enterprise/team tier of users.

**Rough implementation approach:**
1. Slack exports a directory of JSON files (users.json, channels.json, and directories for each channel).
2. The user would need to drop the specific channel folder (or channel JSON) and users.json.
3. We'll need to parse `users.json` to map IDs to real names, and then parse the message payloads.
4. Add a `parseSlack` method to `static/js/parser.js` that maps the IDs back to the sender names and extracts the `ts` and `text` properties.

Labels: enhancement
Title: Add parser for Slack workspace exports

Body:
Noticed this while working on the parsers. The current tool supports personal communication apps well (WhatsApp, Telegram, etc.) but lacks support for professional contexts like Slack.

A Slack workspace export (.json format) could be highly valuable for teams wanting to analyze their communication dynamics.

Implementation approach:
The Slack export is typically a folder of JSON files organized by channel. The `ChatParser` class in `static/js/parser.js` would need a `parseSlack(jsonData)` method that iterates over message objects, standardizing user IDs and texts. Since it's often a folder upload, we may need to handle `.zip` processing or multiple `.json` files in the frontend upload logic first.

Labels: enhancement

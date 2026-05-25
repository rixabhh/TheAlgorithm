
Title: Slack parser edge case for threads
Noticed this while working on the parsers. Slack exports sometimes nest thread replies, which our current flat array parser might miss if they are formatted differently or require fetching.
Expected behavior: The parser extracts all top-level and thread messages into the flat chronological view.
Actual behavior: We only iterate over top-level messages in the flat JSON file structure.
Priority: Medium

Title: Integrate Line parser support
Noticed this while working on the parsers. We support WhatsApp, Signal, and Telegram, but not Line, which is very popular in several regions and uses a structured .txt export similar to WhatsApp.
Why it's valuable: Expands product reach significantly into Asian markets.
Rough implementation approach: Add regex parsing for Line's specific timestamp and sender formatting to `parser.js`.
Priority: Low

Title: Add 'Share to Twitter/X' and 'Share to WhatsApp' quick buttons on the result card

We have an awesome canvas-generated share card and a base64 share link. Right now users have to manually download the card or copy the link, then switch apps to share. We should implement native Web Share API (`navigator.share`) for mobile users and explicit intent links for desktop (e.g. `https://twitter.com/intent/tweet?text=...`) to reduce friction.
This would drive engagement and virality by making the primary "aha" moment a one-tap share, especially on mobile devices where most users likely operate.
Implement buttons underneath the generated share card or in the dashboard header that trigger `navigator.share` with the generated image file (converted from base64 to Blob) and a pre-written hype text + link.

---

Title: Interactive "Pro" demo report or sample data

The "Pro Features" locked UI is great for showing what's coming and capturing waitlist intent. However, to really drive conversion, users need to see _how_ good the deep emotional mapping and PDF exports are.
This drives retention and upgrades because showing is better than telling. If users can click into a "Sample Pro Report" (using dummy data of a famously dramatic fictional relationship, like Ross & Rachel), they'll immediately understand the value of the upgrade.
Create a `/sample-pro` route or a toggle in the dashboard that loads a pre-computed `analysisData` payload showcasing the full premium features (emotional timeline, deep receipts, etc.) with a persistent CTA to "Unlock Pro for your chats".

Title: Add Automated Playwright UI Testing to CI

We currently have a `test_ui.py` script locally that uses Playwright to verify the UI. However, this is not integrated into our `.github/workflows/pipeline.yml`. Adding automated UI verification in CI will help us catch visual and flow regressions before merging PRs.
This matters for contributors because it gives them confidence that their parser/analytics changes haven't broken the dashboard rendering or share cards.

Title: Provide mock test data for new parser developers

Our `CONTRIBUTING.md` instructs developers to validate their parsers locally with their own mock chat exports. We should provide a set of anonymized, standardized mock `.txt` and `.json` chat exports in a `tests/fixtures/` directory.
This matters for contributors because having an immediate, known-good dataset to test against significantly reduces the friction of writing or fixing a parser.

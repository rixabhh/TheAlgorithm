Title: Add anonymized sample chat exports for local testing

Currently, if a new contributor wants to test changes to the parser or verify UI updates in the dashboard, they have to export their own personal chat history from WhatsApp or Telegram.

**Proposed Solution:**
Create a `tests/fixtures/` directory containing small, fully anonymized sample exports (e.g., `sample_whatsapp.txt`, `sample_telegram.html`, `sample_instagram.json`). These samples should use fake names and generic text but match the exact structural format of real exports.

**Why it matters for contributors:**
This removes a significant barrier to entry. New developers can instantly test the app's core functionality and parsing logic without needing to locate, export, and upload their own private data, ensuring a "clone and run in 5 minutes" experience.
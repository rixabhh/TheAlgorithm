## 2026-05-25 — Slack string timestamp integration nuance
**Discovery:** Slack exports JSON string timestamps representing UNIX epochs (e.g. "1618210000.000100") instead of numeric values or milliseconds. The JSON files are often flat arrays or lists of message objects.
**Impact:** `Date()` objects created straight from these strings will be invalid. They must be parsed as floats and multiplied by 1000.
**Action:** Always check the type and scale of exported timestamps, ensuring client-side conversion logic handles scaling strings properly.

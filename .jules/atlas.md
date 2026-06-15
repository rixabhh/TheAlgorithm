## 2024-06-15 — Slack JSON Timestamps
**Discovery:** Slack exports timestamps (`ts` fields) as strings containing Unix seconds and microseconds (e.g. `"1618210000.000100"`).
**Impact:** Client-side JavaScript parsers must explicitly run `parseFloat()` and multiply by 1000 rather than passing the string directly to `new Date()`, otherwise the timestamps will result in `Invalid Date` or parse completely wrong.
**Action:** Always parse JSON timestamps numerically when dealing with platform exports that might use seconds since epoch as strings.

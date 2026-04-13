## 2026-05-14 — Signal Parsing Edge Cases
**Discovery:** The Signal text export format lacks system messages for encryption status compared to WhatsApp, and the date format uses strict `YYYY-MM-DD` instead of ambiguous locales. This makes parsing much simpler but requires strict branching to ensure we don't accidentally parse WhatsApp messages.
**Impact:** Easier parsing but requires robust regex for the `detectSignal` method to avoid false positives.
**Action:** Created dedicated regexes to accurately identify the `[YYYY-MM-DD HH:MM]` pattern.

## 2026-05-14 — Fetch AbortController Integration
**Discovery:** Setting an explicit timeout via an `AbortController` in Cloudflare workers ensures the function returns cleanly within constraints and avoids opaque 504 errors from hanging LLM providers.
**Impact:** Essential for high latency calls, particularly when dealing with providers that may block requests.
**Action:** I'll use the pattern `const controller = new AbortController(); setTimeout(() => controller.abort(), 30000);` for any external API requests in the CF workers in the future.

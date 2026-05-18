## 2024-05-18 — Slack JSON export format
**Discovery:** Slack exports use strings for UNIX epoch timestamps instead of ms integers in `.json` files, requiring explicit multiplication by 1000 before conversion. The format relies heavily on arrays of objects containing `user`, `text`, and `ts` fields.
**Impact:** Essential for correctly parsing chat timelines when handling Slack exports in JavaScript.
**Action:** Need to check string versus number timestamps in `msg.ts` specifically when integrating Slack or new providers.

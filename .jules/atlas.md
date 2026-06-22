## 2023-10-25 — Slack JSON Timestamp Format
**Discovery:** Slack JSON exports format their timestamps (`ts`) as strings representing UNIX epochs in seconds with fractional milliseconds (e.g., `"1618210000.000100"`). They are not standard millisecond integers.
**Impact:** If we attempt to parse them directly as milliseconds (e.g., `new Date(ts)`), it results in invalid dates or dates in the 1970s.
**Action:** When parsing Slack timestamps, explicitly convert the string to a float (`parseFloat(tsStr)`) and multiply by 1000 before passing it into `new Date()`. Additionally, when using `includes` to detect Slack JSON files, watch out for spacing like `"type":"message"`.

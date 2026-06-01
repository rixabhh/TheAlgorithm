## 2024-05-18 — Slack integration and Meta exports

**Discovery:** Slack exports use standard 10-digit UNIX epoch strings (e.g. "1716075932.123456") for the `ts` property, unlike other platforms which use ISO strings or millisecond timestamps directly.
**Impact:** Client-side parsers must explicitly convert the Slack string to a float and multiply by 1000 before constructing a valid JavaScript `Date` object, otherwise the timestamp becomes invalid (NaN) causing messages to be dropped during analysis.
**Action:** When adding new platforms, explicitly inspect and normalize the timestamp format rather than assuming `new Date(value)` will work.

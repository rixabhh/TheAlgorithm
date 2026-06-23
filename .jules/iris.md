## 2024-05-24 — Reciprocity and Conflict Analytics
**Discovery:** Added response time Reciprocity Score and Apology/Conflict tracking. Noticed that the regex lists for `CONFLICT_RE` in the vanilla JS codebase contain "sorry" and "galti", which overlap with apologies. To prevent an apology from being double-counted as both an apology and an argument, prioritizing apology matching before argument tracking is necessary.
**Impact:** Prevents stats skewing where partners attempting repair and apologizing are erroneously penalized as instigating arguments.
**Action:** When creating text classification analytics with potentially overlapping keywords, prioritize the more specific/intent-driven regex match (like apologies) using an `if-else` branch over the broader match (like conflict).

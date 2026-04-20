## 2024-05-18 — Parser Architecture Shifts

**Discovery:** The instructions mention Python-based parsers (`core/parsers.py`), but the actual architecture has moved entirely to client-side Vanilla JS in `static/js/parser.js` for zero-knowledge parsing.
**Impact:** Future expansions need to be focused purely on the JS implementation. Attempting to integrate Python-level changes for parsers will conflict with the client-side approach and the architecture.
**Action:** When adding new platforms or fixing edge cases, update `static/js/parser.js` with the corresponding methods (like `parseSignal`, `detect`) and ensure `app.js` incorporates the changes properly using the updated methods.

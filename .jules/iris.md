## 2024-05-18 — Initial setup
**Discovery:** The analytics engine is client-side JS (`static/js/analytics_engine.js`), not Python in `core/analytics.py` as initially assumed based on older or standard instructions. LLM payload is built directly in the client (`static/js/dashboard.js` prepares it, then calls `/api/analyze` which uses `functions/api/analyze.js`). Display is managed by `dashboard.html` and `dashboard.js`.
**Impact:** Need to write JS analytics and update client-side payload logic + CF Worker prompt.
**Action:** Always read the file structure first instead of assuming Python backend.

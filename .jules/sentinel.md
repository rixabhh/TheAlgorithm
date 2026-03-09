## 2025-05-14 - [XSS in Dashboard Rendering]
**Vulnerability:** XSS (Cross-Site Scripting) via `.innerHTML` when rendering chat messages and LLM-generated content (repair tips, milestones, emojis).
**Learning:** Even AI-generated content should be treated as untrusted user input, as it's derived from the raw chat data. Directly injecting this into the DOM via `.innerHTML` allows for script execution if the chat contains malicious payloads.
**Prevention:** Use `.textContent` for plain text or always wrap dynamic content in a robust `escapeHTML` helper before using `.innerHTML`. Implemented a shared utility `static/js/dashboard_utils.js` for consistent escaping across the dashboard.

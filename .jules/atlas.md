## 2024-05-24 — Unified Parser Detection Logic
**Discovery:** Instead of relying strictly on file extensions or user-selected dropdowns to invoke specific parser logic, inspecting the structure of the chat content (`detect(content)`) reliably identifies the correct parser. This works for JSON blobs (Discord vs Instagram), HTML formats (Telegram), and plain text formats (WhatsApp, Signal).
**Impact:** It simplifies the user experience by reducing manual format selection, decreases parsing errors caused by mismatched format definitions, and provides a unified entry point for all parsed platforms.
**Action:** Always include and robustly test a `detect(content)` method when implementing new chat parsers in the JS codebase, rather than adding new UI selections.

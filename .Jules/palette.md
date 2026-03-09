## 2026-03-09 - [Accessible Drop Zones]
**Learning:** Refactoring a custom `div` dropzone with a `hidden` file input into a `<label>` with a `.sr-only` input provides native keyboard accessibility and simplifies JavaScript by removing manual click listeners.
**Action:** Always prefer `<label for="file-input">` for custom upload UI to ensure it is focusable and triggers the file picker natively.

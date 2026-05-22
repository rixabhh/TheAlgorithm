## 2024-11-20 — Minor UX Polish
**UX Issue:** Modal close buttons lacked ARIA labels, form inputs lacked clear focus states, and the upload zone lacked explicit trust signals.
**Root Cause:** Rapid prototyping resulted in missing a11y labels on icon-only buttons and lack of Neobrutalist focus micro-animations.
**Solution:** Added `aria-label` to the Compare Modal close button, added explicit "Processed locally" text near the dropzone, and implemented Neobrutalism scale+shadow micro-animations on `.btn:hover` and `.field-input:focus` in `style.css`.
**Pattern:** Always validate client side, provide feedback before locking forms, and enforce accessible labels on all icon-only interactive elements.

## 2025-01-24 - Efficient Auto-Expanding Textareas in Vanilla JS

**Learning:** Implementing auto-expanding textareas with `element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px';` on the `input` event is the cleanest native approach, but it requires `resize: none` in CSS to prevent manual override conflicts. Additionally, character counters for limited textareas should always include `aria-live="polite"` so screen reader users are aware of the remaining budget without losing focus.

**Action:** Use this pattern for all multi-line text inputs with character limits to ensure a responsive and accessible experience.

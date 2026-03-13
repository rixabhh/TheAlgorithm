## 2025-01-24 - Efficient Auto-Expanding Textareas in Vanilla JS

**Learning:** Implementing auto-expanding textareas with `element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px';` on the `input` event is the cleanest native approach, but it requires `resize: none` in CSS to prevent manual override conflicts. Additionally, character counters for limited textareas should always include `aria-live="polite"` so screen reader users are aware of the remaining budget without losing focus.

**Action:** Use this pattern for all multi-line text inputs with character limits to ensure a responsive and accessible experience.

## 2026-03-13 - API Key Visibility Toggle & A11y

**Learning:** When implementing visibility toggles for sensitive fields, using a `button` with `type="button"` inside a `relative` container alongside the `input` is the most robust approach. It prevents accidental form submission. Always ensure `aria-label` is updated dynamically (e.g., from "Show API Key" to "Hide API Key") and that labels are explicitly linked via `for` attributes to maintain accessibility standards.

**Action:** Consistently apply this pattern for all secret/key inputs. Ensure focus-visible states are explicitly defined for these utility buttons.

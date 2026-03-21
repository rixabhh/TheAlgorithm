## 2025-01-24 - Efficient Auto-Expanding Textareas in Vanilla JS

**Learning:** Implementing auto-expanding textareas with `element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px';` on the `input` event is the cleanest native approach, but it requires `resize: none` in CSS to prevent manual override conflicts. Additionally, character counters for limited textareas should always include `aria-live="polite"` so screen reader users are aware of the remaining budget without losing focus.

**Action:** Use this pattern for all multi-line text inputs with character limits to ensure a responsive and accessible experience.

## 2026-03-13 - API Key Visibility Toggle & A11y

**Learning:** When implementing visibility toggles for sensitive fields, using a `button` with `type="button"` inside a `relative` container alongside the `input` is the most robust approach. It prevents accidental form submission. Always ensure `aria-label` is updated dynamically (e.g., from "Show API Key" to "Hide API Key") and that labels are explicitly linked via `for` attributes to maintain accessibility standards.

**Action:** Consistently apply this pattern for all secret/key inputs. Ensure focus-visible states are explicitly defined for these utility buttons.

## 2026-05-20 - Staggered Animations & Counting Metrics

**Learning:** When using staggered entry animations with `animation-delay`, setting `animation-fill-mode: both` is critical to ensure elements remain invisible before their animation starts. For numerical "count-up" animations (e.g., scores), `aria-live="polite"` ensures that screen reader users receive the final calculated value once the animation completes, fulfilling standard accessibility expectations for dynamic content.

**Action:** Always use `animation-fill-mode: both` for delayed entrance animations and pair numerical animations with `aria-live="polite"` for accessible results.
## 2026-03-18 - [Toast Notifications & Transitions]
**Learning:** Browser `alert()` calls are disruptive to the premium user experience and inaccessible to some screen readers. Implementing a custom, non-blocking toast system with `role="status"` and `aria-live="polite"` provides better accessibility and UI consistency.
**Action:** Use the `showToast(message, type)` pattern in `dashboard.js` for action feedback, and ensure the `#toast-container` is properly tagged for accessibility.

## 2026-03-19 - [Lazy Triggered Animations for Collapsible Content]
**Learning:** For performance and UX clarity, trigger numerical animations (like `animateValue`) only when their parent collapsible container (e.g., `<details>`) is expanded using the `toggle` event. This ensures users actually see the animation "delight" and prevents unnecessary screen reader activity on hidden content.
**Action:** Use `detailsElement.addEventListener('toggle', ..., { once: true })` to trigger visual polish only when it becomes relevant to the user's viewport.

## 2026-05-22 - [Accessible & Delightful Dropzones]
**Learning:** For file upload components, relying on manual JS style injection is fragile. Using dedicated CSS classes like `.dropzone-active` (with `@keyframes pulse-soft`) and `.dropzone-success` (leveraging `--accent-pink` for confirmation) creates a more robust and delightful experience. Furthermore, applying `:focus-within` to the dropzone container ensures that keyboard users navigating to the hidden file input still receive a clear visual focus indicator, fulfilling essential accessibility requirements.
**Action:** Always prefer CSS-driven state classes over manual style manipulation in JS for interactive components. Ensure focus indicators are visible on parent containers when child inputs are hidden for styling purposes.

## 2026-06-15 - Icon-only Buttons & ARIA Accessibility

**Learning:** When adding micro-interactions like "Copy to Clipboard" using icon-only buttons (SVGs), relying solely on the `title` attribute is insufficient for screen readers. Using a descriptive `aria-label` is mandatory to fulfill accessibility requirements for non-text interactive elements. Pairing this with a success toast notification provides clear, non-disruptive feedback for the action.

**Action:** Ensure all icon-only buttons have an explicit `aria-label` and provide immediate visual feedback (e.g., `showToast`) upon successful action.

## 2024-05-27 — UI/UX Discoveries

**UX Issue:** The prompt mentions standard Tailwind Glassmorphism, but the codebase uses a heavily customized "Retro Groovy Pop-Art" CSS variables system (neobrutalist shadows, sharp borders, bold colors like --pink and --yellow).
**Root Cause:** Pre-existing custom design system overrides standard Tailwind styling to create a unique premium feel.
**Solution:** Acknowledge and preserve the existing design system. Only use Tailwind utility classes where they complement the neobrutalism (e.g., flexbox, spacing, typography) and avoid injecting incompatible glassmorphism aesthetics.
**Pattern:** Always prioritize the actual CSS variables and design tokens (`style.css`) over external generic style guides.

**UX Issue:** The API key input in the configuration modal lacks clear security reassurance immediately around the input field itself, causing user hesitation. Also lacks robust ARIA support for screen readers.
**Root Cause:** Security copy is separated in a different element, and standard accessibility attributes were missed during initial implementation.
**Solution:** Add inline security hints ("Your key is never stored") directly below the input using `aria-describedby` and add proper `aria-label` to all icon buttons (like the copy button).
**Pattern:** Accessibility and Trust go hand-in-hand. Security copy should be programmatically linked to the input it protects.

**UX Issue:** During analysis, the page uses a `loading-overlay` that lacks a polished progress indicator and feels disconnected from the action. The file detection preview is functional but could be styled more seamlessly into the neobrutalist theme.
**Root Cause:** Basic implementation of progress tracking.
**Solution:** Enhance the `loading-overlay` with a smoother progress stepping animation and better typography. Ensure the file detection card uses neobrutalist borders (e.g., `border: 2px solid var(--black); box-shadow: 2px 2px 0 var(--black)`) instead of standard Tailwind borders.
**Pattern:** Interactive elements (loading states, previews) must strictly adhere to the overarching neobrutalist theme to maintain a cohesive premium feel.

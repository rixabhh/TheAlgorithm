## 2026-03-09 - Accessibility and Loading State Polish

**Learning:** Missing 'for' attributes on labels significantly impact accessibility and user convenience (click-to-focus). Additionally, providing immediate feedback (disabling buttons, adding spinners) during long-running async calls prevents duplicate submissions and improves perceived performance.

**Action:** Always verify label-input associations during initial DOM audits. Implement robust loading states for all primary action buttons that trigger fetch requests.

## 2026-03-09 - Global Keyboard Navigation

**Learning:** Modals implemented in Vanilla JS often miss standard keyboard interactions like closing on 'Escape'. This is a critical requirement for an accessible and intuitive user experience.

**Action:** Use a centralized helper function for hiding modals and attach a global 'Escape' key listener at the document level to ensure consistent behavior.

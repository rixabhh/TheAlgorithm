Title: [UX] Mobile swipe transitions between Compare and Single view

Body:
Right now, switching between comparing chats and looking at a single chat is functional via the sidebar picker, but lacks a smooth transition on mobile devices. When opening a chat or closing the comparison view, it snaps abruptly.
Why it matters: The app already uses 200-400ms CSS micro-animations for interactions. A swipe or fade transition will make the core interaction pattern feel significantly more polished and "app-like", maintaining the high-quality glassmorphism aesthetic.
Rough approach:
1. Wrap the main dashboard views inside a transition container in `dashboard.html`.
2. Add a `view-entering` and `view-exiting` CSS class utilizing Tailwind/custom CSS animations in `static/css/style.css`.
3. In `static/js/dashboard.js`, implement a transition delay before removing the `hidden` class and swapping inner HTML data when interacting with the comparison triggers.
Title: Enhance Quick Stats with Micro-Animations

Body: The "Quick Stats" cards on the dashboard are currently static upon load. Adding slight micro-animations, like numbers counting up from 0 to their actual value, would make the data reveal feel much more dynamic and rewarding.
Why it matters: Increases user engagement and perceived value of the insights. A fluid, kinetic UI makes the "Spotify Wrapped" style experience feel premium.
Rough approach: Utilize a lightweight, pure JS counting function in `dashboard.js` or CSS transitions for the stat numbers, triggering via Intersection Observer when the user scrolls the specific card into view.

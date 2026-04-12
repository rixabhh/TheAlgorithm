Title: Add WhatsApp deep links for mobile sharing

The current "Share URL" feature copies a link to the clipboard. On mobile devices (which make up a large percentage of our traffic), a direct "Share to WhatsApp" deep link would significantly reduce friction.

This would create a tighter viral loop since the app is literally analyzing WhatsApp messages.

Rough implementation:
```javascript
const text = "Check out my relationship vibe score!";
const url = generateShareUrlString();
const waLink = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
window.open(waLink, '_blank');
```
Title: Add empty states/error boundaries for dashboard insights

Currently, if the LLM analysis fails to return valid insights or statistical data is empty (due to extremely short chat logs), the dashboard renders empty `.insight-card` blocks or shows "undefined" in the visual comparison graphs.

We should design and implement clear empty states or error boundaries for the dashboard:
1. If the API returns a generic error or parsing fails mid-way, show a recovery path ("Oops, let's try another file") instead of a blank dashboard.
2. If the chat is too short to generate a meaningful analysis (e.g., < 20 messages), present a playful "Not enough drama here!" state rather than rendering broken charts.

This matters because users will inevitably upload very short exports or the LLM provider might timeout. Graceful failure and playful empty states maintain trust and the premium feel of the product, preventing the UI from looking broken.

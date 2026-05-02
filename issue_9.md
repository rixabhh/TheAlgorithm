Title: Add empty states for error conditions on the dashboard

[Describe what the current experience is]
Currently, if there are no insights or stats to show on the dashboard (e.g., due to an error, extreme edge cases, or parsing failure returning an empty dataset), the page displays empty charts or blank cards without helpful context.

[Describe what it should be]
There should be well-designed, friendly empty states explaining why the data isn't visible. For example, "Not enough messages to find a pattern" or "We couldn't extract any data. Try a different chat!" with an option to restart.

[Why this matters for users]
It prevents the UI from looking broken or buggy. Empty states reassure users and guide them toward a recovery path rather than leaving them confused about what went wrong.

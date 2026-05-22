
Title: Add progress indicator during analysis — the page appears frozen
[Describe what the current experience is]: When a user submits an export for analysis, the button changes to "Analyzing..." but the rest of the UI remains completely static. If the analysis takes more than a few seconds, it feels like the application has hung or crashed.
[Describe what it should be]: There should be a dynamic progress indicator (e.g., a progress bar or text steps like "Parsing messages...", "Calculating statistics...", "Generating insights...") that updates as the pipeline progresses.
[Why this matters for users]: In a tool where trust is paramount, lack of feedback during processing causes anxiety. A progress indicator reassures the user that their data is actively being worked on and the application hasn't failed silently.

Title: No error state or recovery path when analysis fails mid-stream
[Describe what the current experience is]: If an error occurs during parsing or the backend API call fails (e.g., rate limit, invalid key), the error message is often either too technical or too generic, and there's no clear way to correct the issue without reloading the page or guessing what went wrong.
[Describe what it should be]: Error states should provide human-readable feedback explaining exactly what failed (e.g., "The API key provided is invalid" or "The uploaded file format isn't supported"). The UI should offer a "Retry" or "Go Back" button to let the user immediately correct the input without losing their context.
[Why this matters for users]: Clear error states and recovery paths prevent user drop-off. If a user hits a wall they don't understand, they'll leave; if the app guides them to fix it, they'll succeed and build trust in the product's robustness.

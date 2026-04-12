Title: Add historical split testing (A/B testing) module for "Pro" tier

Currently the "Compare with Exes" placeholder exists to generate demand. To make the "Pro" tier truly compelling, we should allow users to upload multiple chat histories with the same partner over different time periods (e.g., "Year 1 vs Year 3").

This feature would drive retention, as users would return periodically to see if their "Communication Health" score has improved.

Rough implementation:
Modify the `dashboard.html` comparison UI to accept time-sliced chunks of the same chat export, passing both to the local analytics engine and having the LLM generate a "Delta Report" focusing purely on behavioral changes.
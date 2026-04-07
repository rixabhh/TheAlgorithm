Title: Add Tooltips for Risk Score Phase Definitions

Body:
In the dashboard, we present users with different relationship phases (e.g., 'Honeymoon', 'Stable', 'Tension') based on the risk score analysis. However, it's not immediately obvious to users what these phases mean or how the underlying risk score is calculated (balancing sentiment, latency, and volume).

Why it matters:
When we tell a user their relationship is in a "Tension" phase, we need to provide clarity on why the algorithm thinks so, otherwise it might feel arbitrary or needlessly anxiety-inducing. Transparency builds trust.

Rough approach:
1. Create a `tooltip` CSS class or utilize an existing one in our style system.
2. In `dashboard.js`, when rendering the phases or risk scores (perhaps in a future dedicated timeline card or the mood chart), attach the tooltips.
3. The tooltip text should clearly map to the logic in `AnalyticsEngine.calculateRiskScore` (e.g., "Tension phase is triggered when negative sentiment overlaps with slower response times and lower overall volume").
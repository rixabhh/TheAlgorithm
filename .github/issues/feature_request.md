Title: Add Follow-Up Conversational Interface to Insights

## Why this feature matters
Currently, the AI analysis is a static, one-time read. Users often have questions about specific red flags, want elaboration on their coaching advice, or want to ask specific context about their chat data. Making the report interactive will significantly increase user retention and session time.

## Rough implementation approach
- Add a new "Ask The Algorithm" chat input box below the Deep Insights section.
- Create a new backend endpoint `/api/followup` that accepts the original `stats`, the initial `report`, and the user's `question`.
- Pass these as context to the LLM (using the same provider abstraction logic) and stream the response back to the UI.
- Ensure the prompt maintains the persona chosen by the user (Playful, Balanced, or Direct).

## User benefit
Allows users to treat their chat analysis as a personalized relationship coach rather than just a one-off report. It deepens emotional engagement and makes the product significantly more shareable and valuable.

Title: Missing detailed frontend testing guide in CONTRIBUTING.md

Currently, `CONTRIBUTING.md` contains details on backend development (Python/Flask) and adding a new parser logic.

However, we should provide instructions to new contributors about how they can effectively develop and test frontend changes without the burden of learning how Playwright UI testing works if it is added.

I propose adding a dedicated testing section explaining how to manually load the chat logs and verify the dashboard visualizes the data properly for different chat types. We could potentially also link to test fixtures if we add them to the repository for this explicit purpose.

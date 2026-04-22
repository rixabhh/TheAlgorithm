Title: [DX] Add a dummy chat data generator script to test the dashboard easily

Currently, testing the analytics dashboard and UI visualizations requires a contributor to upload real chat export files or manually construct a mock export. This is tedious and can slow down UI/UX iterations.

Adding a small script (e.g., in a `scripts/` folder) that generates synthetic, well-formatted dummy chat data for WhatsApp/Telegram formats would significantly speed up frontend development and give new contributors an immediate way to test the platform.

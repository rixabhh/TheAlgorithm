# Contributing to The Algorithm

Welcome to **The Algorithm**! We're thrilled you want to contribute to our privacy-first relationship analyzer.

## Developer Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rixabhh/TheAlgorithm.git
   cd TheAlgorithm
   ```

2. **Environment Configuration:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your API keys to `.env` if needed.

3. **Install Dependencies & Run:**
   Using the `Makefile` is the easiest way to work with the project:
   ```bash
   # Create a virtual environment first (recommended)
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install pytest pytest-cov ruff

   # Start the development server
   make dev
   ```

4. **Testing and Linting:**
   ```bash
   make test
   make lint
   make format
   ```

5. **Docker:**
   ```bash
   make docker-build
   make docker-run
   ```

## Adding a New Parser

The core of the analysis relies on correctly parsing chat exports. If you want to add support for a new platform (e.g., Signal, iMessage), follow these steps:

1.  **Locate the Parsers:**
    Open `static/js/parser.js`. This is where all client-side parsing happens in volatile memory.

2.  **Create the Parser Logic:**
    Add a new parser object (e.g., `parseSignal(text)`) or extend the existing `parseChat` logic to recognize the new format.

3.  **Implement `detect()`:**
    Every parser must include a detection method to automatically identify the chat format based on the first few lines of the file.
    ```javascript
    // Example
    if (firstLines.includes("Signal Export")) {
        return parseSignal(fileContent);
    }
    ```

4.  **Extract Standard Metadata:**
    Ensure your parser returns the standardized statistics object expected by the analytics engine:
    *   Total Messages
    *   Participant names
    *   Message timestamps (for response time/time-of-day stats)
    *   Word counts, emoji usage, etc.
    *   *Crucially:* **Do not include raw chat text in the final output object.**

5.  **Test the Parser:**
    Load a sample export from the new platform in the browser and verify the dashboard visualizes the data correctly.

## Privacy Golden Rules
- **No data hits the disk:** Do not write anything to the server's filesystem.
- **No PII to the LLM:** Ensure personal data (names, numbers, raw text) is completely redacted or dropped before the payload is sent to any LLM API.
- **Only stats:** The LLM should only ever receive numerical or abstracted metadata.

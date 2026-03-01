FROM python:3.11-slim

WORKDIR /app

# Install OS-level deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentiment model during build (cached layer)
ENV MODEL_DIR=/app/models/sentiment
COPY scripts/ scripts/
RUN python scripts/download_model.py

# Copy application code
COPY . .

# Download favicon if missing (stripped from HF push to avoid binary rejection)
RUN if [ ! -f static/favicon.png ]; then \
      curl -sL https://media.githubusercontent.com/media/rixabhh/TheAlgorithm/main/static/favicon.png -o static/favicon.png || true; \
    fi

# Create uploads directory
RUN mkdir -p uploads

# Expose port for Hugging Face Spaces
ENV PORT=7860
EXPOSE 7860

# Set up a non-root user required by Hugging Face
RUN adduser --system --uid 1000 --group user
RUN chown -R 1000:1000 /app

USER 1000

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "300", "app:app"]

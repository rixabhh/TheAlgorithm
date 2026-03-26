FROM python:3.11

WORKDIR /app

# Install OS-level deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-create directories for static assets and models
RUN mkdir -p static models/sentiment uploads

# Install heavyweight Python deps first (cached layer)
# Explicitly use CPU wheels to keep image small and prevent OOM/freezes
RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu \
    transformers

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentiment model during build (cached layer)
ENV MODEL_DIR=/app/models/sentiment
COPY scripts/ scripts/
RUN python scripts/download_model.py

# Copy application code
COPY . .

# Create a dummy favicon if missing (stripped from HF push to avoid binary rejection)
RUN if [ ! -f static/favicon.png ]; then \
      echo "" > static/favicon.png; \
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

# Run with gunicorn for production (1 worker, 4 threads to share in-memory session state)
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "300", "app:app"]

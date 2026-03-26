FROM python:3.10-slim

# Install OS-level deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 🛡️ Sentinel: Ensure logs are streamed in real-time
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_DEFAULT_TIMEOUT=100

# Pre-create directories for static assets and models
RUN mkdir -p static models/sentiment uploads

# Update pip and install CPU-only deps
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir transformers

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create a dummy favicon if missing (stripped from HF push to avoid binary rejection)
RUN if [ ! -f static/favicon.png ]; then \
      echo "" > static/favicon.png; \
    fi

# Set up a non-root user required by Hugging Face
RUN adduser --system --uid 1000 --group user && \
    chown -R 1000:1000 /app

USER 1000

# Pre-download the sentiment model (happens as the non-root user now)
ENV MODEL_DIR=/app/models/sentiment
RUN python scripts/download_model.py

# Expose port for Hugging Face Spaces
ENV PORT=7860
EXPOSE 7860

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "300", "app:app"]

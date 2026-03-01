FROM python:3.11-slim

WORKDIR /app

# Install OS-level deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
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

# Create uploads directory
RUN mkdir -p uploads

# Expose port
ENV PORT=5000
EXPOSE 5000

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "300", "app:app"]

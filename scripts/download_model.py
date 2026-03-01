"""
Pre-download the sentiment model so it's baked into the Docker image.
Run this during `docker build` to avoid cold-start downloads.
"""
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
MODEL_DIR = os.environ.get("MODEL_DIR", "/app/models/sentiment")

print(f"Downloading {MODEL_NAME} to {MODEL_DIR}...")
AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir=MODEL_DIR)
AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, cache_dir=MODEL_DIR)
print("Model downloaded successfully.")

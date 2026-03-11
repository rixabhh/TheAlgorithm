"""
Pre-download the sentiment model so it's baked into the Docker image.
Run this during `docker build` to avoid cold-start downloads.
"""
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
MODEL_DIR = os.environ.get("MODEL_DIR", "/app/models/sentiment")

print(f"Downloading {MODEL_NAME} to {MODEL_DIR}...")
# 🛡️ Sentinel: Pin model revision for supply chain integrity
REVISION = "f2f1202"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, revision=REVISION)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, revision=REVISION)

tokenizer.save_pretrained(MODEL_DIR)
model.save_pretrained(MODEL_DIR)
print("Model downloaded and saved successfully.")

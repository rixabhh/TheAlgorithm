from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import pipeline
import json
import uvicorn
import os

app = FastAPI(title="The Algorithm - Cloud GPU API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model once on boot
print("Loading XLM-RoBERTa Sentiment Pipeline into GPU...")
model_name = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
# device=0 targets the first available GPU (Lightning Studio T4/L4)
sentiment_pipeline = pipeline("sentiment-analysis", model=model_name, device=0) 
print("Model loaded successfully.")

class TextPayload(BaseModel):
    texts: List[str]

@app.post("/analyze")
async def analyze_sentiment(payload: TextPayload):
    """
    Accepts a JSON list of strings.
    Processes them through the GPU-accelerated NLP model.
    Returns a JSON list of integer sentiment scores.
    """
    try:
        if not payload.texts:
             return {"scores": []}
             
        # Robust generator to stream data to the GPU in batches
        # This fixes the "must be type str" error and maximizes efficiency
        def data_gen():
            for text in payload.texts:
                yield str(text) if text else ""
             
        # Inference via pipeline using the generator
        results = sentiment_pipeline(data_gen(), batch_size=128, truncation=True)
        
        sentiment_scores = []
        for r in results:
            label = r['label'].lower()
            if 'positive' in label or label == 'label_2':
                sentiment_scores.append(1)
            elif 'negative' in label or label == 'label_0':
                sentiment_scores.append(-1)
            else:
                sentiment_scores.append(0)
                
        return {"scores": sentiment_scores}
        
    except Exception as e:
        # 🛡️ Sentinel: Mask internal exceptions to prevent information disclosure
        print(f"Error during GPU inference: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred during GPU inference.")

@app.get("/")
async def root():
    return {"message": "The Algorithm Cloud API is running successfully. Please post to /analyze for sentiment scoring."}

@app.get("/health")
async def health_check():
    return {"status": "online", "gpu_enabled": True}

if __name__ == "__main__":
    # 🛡️ Sentinel: Use environment variable for host binding to follow security best practices
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=8000)

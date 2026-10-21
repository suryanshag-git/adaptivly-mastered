#!/usr/bin/env python3
"""main.py

FastAPI gateway exposing the adaptive difficulty model trained in
`train_knowledge_tracing.py`. It loads `adaptive_model.pkl` on startup and
provides a single `POST /predict` endpoint.
"""

from pathlib import Path
from typing import TypedDict

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Load the pre‑trained model (created by train_knowledge_tracing.py)
MODEL_PATH = Path(__file__).with_name("adaptive_model.pkl")
if not MODEL_PATH.is_file():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run train_knowledge_tracing.py first.")
model = joblib.load(MODEL_PATH)

app = FastAPI(title="Adaptivly Adaptive Difficulty Service", version="0.1")

class Telemetry(BaseModel):
    past_accuracy: float = Field(..., ge=0.0, le=1.0, description="Proportion of correct past submissions")
    avg_runtime_ms: float = Field(..., gt=0, description="Average runtime of past submissions in milliseconds")
    current_difficulty: int = Field(..., ge=1, le=3, description="Current difficulty tier (1=Easy, 2=Medium, 3=Hard)")

class PredictionResponse(TypedDict):
    recommended_difficulty: int

@app.post("/predict", response_model=PredictionResponse)
def predict(telemetry: Telemetry):
    # Prepare feature array – the model expects the same column order as training
    X = np.array([
        telemetry.past_accuracy,
        telemetry.avg_runtime_ms,
        telemetry.current_difficulty,
    ]).reshape(1, -1)

    try:
        pred = model.predict(X)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"recommended_difficulty": int(pred)}

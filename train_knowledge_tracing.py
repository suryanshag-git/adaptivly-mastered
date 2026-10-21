#!/usr/bin/env python3
"""train_knowledge_tracing.py

Self‑contained script that creates a synthetic knowledge‑tracing dataset,
trains a RandomForest classifier and stores the model.

Features (per row)
- past_accuracy: float in [0, 1] – proportion of correct past submissions
- avg_runtime_ms: float – average runtime of past submissions (ms)
- current_difficulty: int in {1, 2, 3} – 1=Easy, 2=Medium, 3=Hard

Target
- next_optimal_difficulty: int in {1, 2, 3}
  Determined by simple deterministic rules that emulate a plausible tutoring
  policy.
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    f1_score,
    roc_auc_score,
)
from sklearn.preprocessing import label_binarize
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_STATE = 42
N_SAMPLES = 10_000
MODEL_PATH = Path(__file__).with_name("adaptive_model.pkl")

# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------
def generate_synthetic_data(n: int = N_SAMPLES) -> pd.DataFrame:
    """Create a DataFrame with the required columns.

    The generation logic mimics a simplified knowledge‑tracing environment:
    * past_accuracy is drawn from a beta distribution to favour values near 0.5
    * avg_runtime_ms is correlated with difficulty (harder problems tend to be
      slower) plus some noise.
    * current_difficulty is sampled uniformly among 1, 2, 3.
    * The target ``next_optimal_difficulty`` follows deterministic rules:
        - If past_accuracy > 0.8 -> increase difficulty (capped at 3)
        - If past_accuracy < 0.4 -> decrease difficulty (floored at 1)
        - Otherwise keep the same difficulty.
      Additionally, extremely high avg_runtime_ms (slow execution) nudges the
      recommendation down by one level, while very low runtime nudges it up.
    """
    rng = np.random.default_rng(seed=RANDOM_STATE)

    past_accuracy = rng.beta(a=2, b=2, size=n)  # roughly centered around 0.5
    current_difficulty = rng.integers(1, 4, size=n)  # 1,2,3 inclusive

    # Base runtime: easier problems tend to be faster
    base_runtime = np.where(
        current_difficulty == 1,
        rng.normal(500, 100, size=n),  # Easy ~500ms
        np.where(
            current_difficulty == 2,
            rng.normal(1000, 200, size=n),  # Medium ~1000ms
            rng.normal(1500, 300, size=n),  # Hard ~1500ms
        ),
    )
    # Add noise proportional to past_accuracy (more accurate students are quicker)
    noise = rng.normal(0, 50, size=n) - past_accuracy * 100
    avg_runtime_ms = np.clip(base_runtime + noise, 100, None)

    # Deterministic rule for next optimal difficulty
    next_optimal = []
    for acc, rt, cur in zip(past_accuracy, avg_runtime_ms, current_difficulty):
        # Start with current difficulty
        nxt = cur
        # Accuracy driven adjustment
        if acc > 0.8:
            nxt = min(3, nxt + 1)
        elif acc < 0.4:
            nxt = max(1, nxt - 1)
        # Runtime driven adjustment (slow => easier, fast => harder)
        if rt > 1300:
            nxt = max(1, nxt - 1)
        elif rt < 600:
            nxt = min(3, nxt + 1)
        next_optimal.append(nxt)

    df = pd.DataFrame(
        {
            "past_accuracy": past_accuracy,
            "avg_runtime_ms": avg_runtime_ms,
            "current_difficulty": current_difficulty,
            "next_optimal_difficulty": next_optimal,
        }
    )
    return df

# ---------------------------------------------------------------------------
# Model training / evaluation
# ---------------------------------------------------------------------------
def evaluate(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> None:
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    # AUC for multi‑class (One‑vs‑Rest)
    y_bin = label_binarize(y_true, classes=[1, 2, 3])
    try:
        auc = roc_auc_score(y_bin, y_proba, average="macro", multi_class="ovr")
    except Exception:
        auc = float("nan")
    print("--- Evaluation Metrics ---")
    print(f"Accuracy   : {acc:.4f}")
    print(f"Precision  : {prec:.4f}")
    print(f"F1‑Score   : {f1:.4f}")
    print(f"AUC (OVR)  : {auc:.4f}")

def main() -> None:
    print("Generating synthetic dataset …")
    df = generate_synthetic_data()
    X = df[["past_accuracy", "avg_runtime_ms", "current_difficulty"]]
    y = df["next_optimal_difficulty"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=RANDOM_STATE, stratify=y
    )

    print("Training RandomForest …")
    clf = RandomForestClassifier(
        n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)
    evaluate(y_test.values, y_pred, y_proba)

    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(clf, MODEL_PATH)
    print("Done.")

if __name__ == "__main__":
    main()

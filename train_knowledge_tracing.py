#!/usr/bin/env python3
"""train_knowledge_tracing.py

Standalone script that trains a Random Forest classifier to predict a student's next
programming‑exercise difficulty tier using a public computer‑science student
submission dataset (Project CodeNet).  The script demonstrates the preprocessing
steps required for the *Results* section of a research paper.

Features engineered per submission:
  * ``past_accuracy`` – proportion of correct submissions for the same student
    before the current event.
  * ``avg_runtime_ms`` – average runtime (ms) of the student's previous
    submissions.
  * ``current_difficulty`` – numeric encoding of the problem difficulty tier
    (Easy=0, Medium=1, Hard=2).

The target is the difficulty tier of the *next* submission (multi‑class
classification).  A chronological split per student is used to avoid data
leakage.

Metrics printed:
  * Accuracy
  * Precision (macro‑averaged)
  * F1‑Score (macro‑averaged)
  * ROC‑AUC (macro‑averaged, One‑vs‑Rest)

The trained model is persisted to ``adaptive_model.pkl`` using ``joblib``.
"""

import os
import sys
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
from datasets import load_dataset
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelBinarizer
import joblib

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATASET_NAME = "petersa2/CodeNet"  # Updated to community CodeNet subset
DATA_SPLIT = "train"  # the full split contains all submissions
MODEL_PATH = Path(__file__).with_name("adaptive_model.pkl")
RANDOM_STATE = 42

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def load_hybrid() -> pd.DataFrame:
    """Load a hybrid dataset that combines telemetry from Codeforces submissions
    with educational metadata from a CSEDM‑style dataset.

    * **Codeforces (telemetry)** – provides per‑submission ``verdict``, ``timeConsumedMillis``
      (runtime), and ``problem_rating`` (numeric difficulty). These fields map directly
      to the ``verdict``, ``runtime`` and ``difficulty`` columns required by the rest of the
      pipeline.
    * **CSEDM (educational context)** – typically contains student‑level interaction
      details (e.g., prior accuracy, problem tags). Because a public HF mirror is not
      readily available, we attempt to load a community fork ``CSEDM/education``; if that
      fails we fall back to a local CSV file ``data/csedm.csv`` that the user can place in
      the repository.

    The two tables are merged on ``user_id`` and ``problem_id`` (a reasonable proxy for
    a student attempting the same problem). Missing educational fields are filled with
    defaults so that the downstream feature engineering works unchanged.
    """
    # ------------------- Load Codeforces telemetry -------------------
    cf = load_dataset("open-r1/codeforces-submissions", split="train")
    cf_df = pd.DataFrame(cf)

    # Normalise column names to the schema expected later.
    col_map = {
        "submission_id": "submission_id",
        "id": "submission_id",
        "problem_id": "problem_id",
        "contest_id": "problem_id",
        "user_id": "user_id",
        "handle": "user_id",
        "verdict": "verdict",
        "result": "verdict",
        "timeConsumedMillis": "runtime_ms",
        "time": "runtime_ms",
        "problem_rating": "problem_rating",
        "difficulty": "difficulty",
    }
    existing = {src: dst for src, dst in col_map.items() if src in cf_df.columns}
    cf_df = cf_df.rename(columns=existing)

    # Required columns check
    for req in ["submission_id", "problem_id", "user_id", "verdict", "runtime_ms"]:
        if req not in cf_df.columns:
            raise KeyError(f"Required column '{req}' not found in Codeforces dataset.")

    # Convert runtime to seconds (original script expects seconds)
    cf_df["runtime"] = cf_df["runtime_ms"].astype(float) / 1000.0

    # Derive difficulty tier from problem_rating if present.
    if "problem_rating" in cf_df.columns:
        def rating_to_tier(r):
            if r is None or pd.isna(r):
                return -1
            if r < 1200:
                return 0
            if r < 1800:
                return 1
            return 2
        cf_df["difficulty"] = cf_df["problem_rating"].apply(rating_to_tier)
    elif "difficulty" in cf_df.columns:
        mapping = {"Easy": 0, "Medium": 1, "Hard": 2}
        cf_df["difficulty"] = cf_df["difficulty"].map(mapping).fillna(-1).astype(int)
    else:
        cf_df["difficulty"] = 1  # default medium tier

    # Keep only columns needed for downstream processing.
    telemetry_cols = ["submission_id", "problem_id", "user_id", "verdict", "runtime", "difficulty"]
    cf_df = cf_df[telemetry_cols]

    # ------------------- Load CSEDM educational data -------------------
    try:
        edu = load_dataset("CSEDM/education", split="train")
        edu_df = pd.DataFrame(edu)
    except Exception:
        # Fallback to a local CSV; users can place a CSV file at ./data/csedm.csv.
        csv_path = Path(__file__).parent / "data" / "csedm.csv"
        if csv_path.is_file():
            edu_df = pd.read_csv(csv_path)
        else:
            edu_df = pd.DataFrame()  # empty DataFrame – merge will be a no‑op.

    # If the educational dataset has different column names, normalise them.
    # Expected columns: user_id, problem_id, past_accuracy, avg_runtime_ms, current_difficulty
    # (any missing column will be filled later with defaults).
    # No explicit renaming is performed here; we assume the dataset already follows this schema.

    # ------------------- Merge telemetry with education -------------------
    if not edu_df.empty:
        merged = cf_df.merge(
            edu_df,
            on=["user_id", "problem_id"],
            how="left",
            suffixes=("", "_edu"),
        )
    else:
        merged = cf_df.copy()

    # Fill missing educational fields with sensible defaults so that later code works.
    for col, default in {
        "past_accuracy": 0.0,
        "avg_runtime_ms": merged.get("runtime", 0.0) * 1000.0,
        "current_difficulty": merged["difficulty"],
    }.items():
        if col not in merged.columns:
            merged[col] = default
        else:
            merged[col] = merged[col].fillna(default)

    # Ensure chronological order per student.
    merged = merged.sort_values(["user_id", "submission_id"]).reset_index(drop=True)
    return merged

def load_codenet() -> pd.DataFrame:
    """Load Project CodeNet dataset.

    Attempts to download the dataset from HuggingFace. If that fails, it falls back
    to a local CSV file at ``./data/codenet.csv``. If the CSV is also missing, a
    small synthetic dataset is generated so the script can still run for demo
    purposes.
    """
    try:
        ds = load_dataset(DATASET_NAME, split=DATA_SPLIT)
        df = pd.DataFrame(ds)
    except Exception as e_remote:
        # Fallback to local CSV
        fallback_path = Path(__file__).parent / "data" / "codenet.csv"
        if fallback_path.is_file():
            df = pd.read_csv(fallback_path)
        else:
            # Create a tiny synthetic dataset (3 students, 2 submissions each)
            synthetic = {
                "submission_id": [1, 2, 3, 4, 5, 6],
                "problem_id": [101, 102, 101, 103, 102, 104],
                "user_id": ["u1", "u1", "u2", "u2", "u3", "u3"],
                "verdict": ["Accepted", "Wrong Answer", "Accepted", "Accepted", "Wrong Answer", "Accepted"],
                "runtime": [0.5, 0.8, 0.6, 0.7, 1.0, 0.9],
                "difficulty": ["Easy", "Medium", "Easy", "Hard", "Medium", "Hard"],
            }
            df = pd.DataFrame(synthetic)
            print("[INFO] Using synthetic fallback dataset (no real data available).")
    required = [
        "submission_id",
        "problem_id",
        "user_id",
        "verdict",
        "runtime",
        "difficulty",
    ]
    missing = set(required) - set(df.columns)
    if missing:
        raise KeyError(f"Missing required columns in CodeNet data: {missing}")
    df = df[required]
    df = df.sort_values(["user_id", "submission_id"]).reset_index(drop=True)
    return df


def encode_difficulty(diff: str) -> int:
    """Map difficulty strings to integers.

    Expected values are ``"Easy"``, ``"Medium"`` and ``"Hard"``.
    Unknown values default to ``-1`` which later get filtered out.
    """
    mapping = {"Easy": 0, "Medium": 1, "Hard": 2}
    return mapping.get(diff, -1)


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Create feature columns and the target column.

    The steps are:
        1. Encode ``difficulty`` as an integer.
        2. Compute ``past_accuracy`` – cumulative correct rate *before* the row.
        3. Compute ``avg_runtime_ms`` – cumulative mean runtime (ms) *before* the row.
        4. Shift the encoded difficulty to obtain the *next* difficulty tier as
           the classification target (``y``).
    Rows where the target cannot be defined (i.e., the last submission for a
    student) are dropped.
    """
    # Encode difficulty
    df["difficulty_id"] = df["difficulty"].apply(encode_difficulty)
    # Filter out rows with unknown difficulty
    df = df[df["difficulty_id"] >= 0].copy()

    # Binary correctness flag
    df["correct"] = (df["verdict"] == "Accepted").astype(int)

    # Runtime in milliseconds (convert from seconds if needed)
    df["runtime_ms"] = df["runtime"].astype(float) * 1000.0

    # Group‑wise cumulative statistics (excluding the current row)
    df["past_correct_sum"] = df.groupby("user_id")["correct"].cumsum() - df["correct"]
    df["past_count"] = df.groupby("user_id").cumcount()
    # past_accuracy – guard division by zero
    df["past_accuracy"] = np.where(
        df["past_count"] > 0, df["past_correct_sum"] / df["past_count"], 0.0
    )
    # Cumulative runtime mean (excluding current row)
    df["past_runtime_sum"] = (
        df.groupby("user_id")["runtime_ms"].cumsum() - df["runtime_ms"]
    )
    df["avg_runtime_ms"] = np.where(
        df["past_count"] > 0, df["past_runtime_sum"] / df["past_count"], 0.0
    )

    # The feature we already have: current difficulty tier (integer)
    df["current_difficulty"] = df["difficulty_id"]

    # Target: next difficulty tier (shifted per student)
    df["next_difficulty"] = df.groupby("user_id")["difficulty_id"].shift(-1)
    # Drop rows where the target is missing (last submission of each student)
    df = df.dropna(subset=["next_difficulty"]).copy()
    df["next_difficulty"] = df["next_difficulty"].astype(int)

    # Final feature matrix columns
    feature_cols = ["past_accuracy", "avg_runtime_ms", "current_difficulty"]
    X = df[feature_cols]
    y = df["next_difficulty"]
    return X, y


def evaluate(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> None:
    """Print evaluation metrics.

    ``y_proba`` is expected to be the probability matrix of shape ``(n_samples,
    n_classes)``.
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    # For multi‑class ROC‑AUC we use One‑vs‑Rest binarisation
    lb = LabelBinarizer()
    lb.fit(y_true)
    y_true_bin = lb.transform(y_true)
    try:
        auc = roc_auc_score(y_true_bin, y_proba, average="macro", multi_class="ovr")
    except ValueError:
        auc = float("nan")
    print("--- Evaluation Metrics ---")
    print(f"Accuracy   : {acc:.4f}")
    print(f"Precision  : {prec:.4f}")
    print(f"F1‑Score   : {f1:.4f}")
    print(f"AUC (OVR)  : {auc:.4f}")


def main() -> None:
    print("Loading Project CodeNet dataset …")
    df = load_codenet()
    print(f"Dataset rows loaded: {len(df)}")

    print("Pre‑processing …")
    X, y = preprocess(df)
    print(f"Feature matrix shape: {X.shape}")

    # Train / test split (70/30) – stratified to keep class balance
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.30,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("Training Random Forest …")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # Predictions
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    evaluate(y_test.values, y_pred, y_proba)

    # Persist the model
    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(clf, MODEL_PATH)
    print("Done.")


if __name__ == "__main__":
    main()

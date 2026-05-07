"""Heart and diabetes inference for the FastAPI ML service.

Adapted from `ML Services/Heart&diabeties/predict.py`. Models are loaded
lazily on first call and cached in module state so subsequent requests
do not re-read the joblib files from disk.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

MODEL_FILES = {
    "diabetes": MODELS_DIR / "diabetes_model.joblib",
    "heart": MODELS_DIR / "heart_model.joblib",
}

_model_cache: Dict[str, Dict[str, Any]] = {}


def _load_model(model_type: str) -> Dict[str, Any]:
    if model_type in _model_cache:
        return _model_cache[model_type]
    if model_type not in MODEL_FILES:
        raise ValueError("Invalid model type. Use 'diabetes' or 'heart'.")
    model_file = MODEL_FILES[model_type]
    if not model_file.exists():
        raise FileNotFoundError(
            f"Model not found at {model_file}. Train models first using train_models.py"
        )
    _model_cache[model_type] = joblib.load(model_file)
    return _model_cache[model_type]


def run_prediction(payload: Dict[str, Any]) -> Dict[str, Any]:
    model_type = payload.get("modelType")
    features = payload.get("features", {})

    saved_model = _load_model(model_type)
    model = saved_model["model"]
    expected_features = saved_model["features"]
    label_map = saved_model["label_map"]

    input_row = {feature: features.get(feature) for feature in expected_features}
    if any(value is None for value in input_row.values()):
        missing = [k for k, v in input_row.items() if v is None]
        raise ValueError(f"Missing features: {', '.join(missing)}")

    df = pd.DataFrame([input_row])
    prediction = int(model.predict(df)[0])

    probability = None
    if hasattr(model, "predict_proba"):
        probability = float(model.predict_proba(df)[0][1])

    return {
        "result": label_map[prediction],
        "prediction": prediction,
        "probability": probability,
    }

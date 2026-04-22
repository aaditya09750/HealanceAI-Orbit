import json
import sys
from pathlib import Path

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

MODEL_FILES = {
    "diabetes": MODELS_DIR / "diabetes_model.joblib",
    "heart": MODELS_DIR / "heart_model.joblib",
}


def run_prediction(payload: dict) -> dict:
    model_type = payload.get("modelType")
    features = payload.get("features", {})

    if model_type not in MODEL_FILES:
        raise ValueError("Invalid model type. Use 'diabetes' or 'heart'.")

    model_file = MODEL_FILES[model_type]
    if not model_file.exists():
        raise FileNotFoundError(
            f"Model not found at {model_file}. Train models first using train_models.py"
        )

    saved_model = joblib.load(model_file)
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


if __name__ == "__main__":
    try:
        payload = json.load(sys.stdin)
        output = run_prediction(payload)
        print(json.dumps(output))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)

"""Symptom-disease inference for the FastAPI ML service.

Adapted from `ML Services/Symtums_diseas/predict_symptom_disease.py`.
Refactored so the heavy model artifacts can be loaded ONCE at FastAPI
startup (`load_artifacts`) and reused across requests via
`run_prediction_with_artifacts(...)` instead of re-reading the 44 MB
pickle on every call.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "symptom_disease_model.pkl"
DETAILS_PATH = MODELS_DIR / "disease_details.json"

TOP_K = 5

GENERIC_DIETS = [
    "Stay hydrated with water, soups, and electrolyte-rich fluids.",
    "Choose light home-cooked meals with vegetables, dal, and fruits.",
    "Avoid oily, deep-fried, and very sugary foods during recovery.",
]

GENERIC_WORKOUTS = [
    "Take short, gentle walks (10-20 minutes) based on energy level.",
    "Do light stretching and mobility exercises once or twice daily.",
    "Practice deep breathing for 5-10 minutes to improve recovery.",
]

_FOOD_KEYWORD_TO_COL = {
    "street food": "recent_food_street",
    "street": "recent_food_street",
    "seafood": "recent_food_seafood",
    "sea food": "recent_food_seafood",
    "leftovers": "recent_food_leftovers",
}


def _to_binary(value) -> int:
    if isinstance(value, bool):
        return int(value)
    text = str(value or "").strip().lower()
    return 1 if text in {"1", "true", "yes", "y", "present", "on"} else 0


def _expand_food_multiselect(value) -> Dict[str, int]:
    out = {col: 0 for col in _FOOD_KEYWORD_TO_COL.values()}
    if value is None:
        return out
    items: List[str] = []
    if isinstance(value, list):
        items = [str(v) for v in value]
    elif isinstance(value, str):
        items = [s.strip() for s in value.split(",") if s.strip()]
    for item in items:
        key = item.strip().lower()
        col = _FOOD_KEYWORD_TO_COL.get(key)
        if col:
            out[col] = 1
    return out


def load_artifacts():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run train_symptom_model.py first."
        )
    payload = joblib.load(MODEL_PATH)

    if "feature_columns" not in payload and "features" in payload:
        payload["feature_columns"] = payload["features"]
        payload["binary_features"] = payload["features"]
        payload["numeric_features"] = []
        payload["categorical_features"] = []
        payload["food_features"] = []
        payload["classes"] = list(getattr(payload["model"], "classes_", []))
        payload["uses_integer_labels"] = False

    details = {}
    if DETAILS_PATH.exists():
        details = json.loads(DETAILS_PATH.read_text(encoding="utf-8"))

    return payload, details


def build_feature_row(payload_schema: dict, request: dict) -> dict:
    binary_cols = payload_schema.get("binary_features", [])
    numeric_cols = payload_schema.get("numeric_features", [])
    categorical_cols = payload_schema.get("categorical_features", [])
    food_cols = payload_schema.get("food_features", [])

    provided_features = request.get("features") if isinstance(request.get("features"), dict) else {}
    symptoms_list = request.get("symptoms") if isinstance(request.get("symptoms"), list) else []
    symptom_set = {str(s).strip().lower() for s in symptoms_list}
    context = request.get("context") if isinstance(request.get("context"), dict) else {}

    row: dict = {}

    for col in binary_cols:
        key = col.strip().lower()
        if key in provided_features:
            row[col] = _to_binary(provided_features.get(key))
        elif col in provided_features:
            row[col] = _to_binary(provided_features.get(col))
        else:
            row[col] = 1 if key in symptom_set else 0

    food_values = _expand_food_multiselect(context.get("recent_food"))
    for col in food_cols:
        if col in context and context.get(col) is not None:
            row[col] = _to_binary(context.get(col))
        else:
            row[col] = food_values.get(col, 0)

    for col in numeric_cols:
        value = context.get(col)
        try:
            row[col] = float(value) if value is not None and value != "" else 0.0
        except (TypeError, ValueError):
            row[col] = 0.0

    for col in categorical_cols:
        value = context.get(col)
        if value is None or value == "" or value == []:
            row[col] = "unknown"
        elif isinstance(value, list):
            row[col] = str(value[0]) if value else "unknown"
        else:
            row[col] = str(value)

    return row


def top_predictions(model_payload: dict, frame: pd.DataFrame, limit: int = TOP_K):
    model = model_payload["model"]
    class_order = model_payload.get("classes", [])
    uses_int_labels = bool(model_payload.get("uses_integer_labels"))

    if not hasattr(model, "predict_proba"):
        label = model.predict(frame)[0]
        if uses_int_labels:
            label = class_order[int(label)] if 0 <= int(label) < len(class_order) else str(label)
        return [{"disease": str(label), "confidence": None}]

    probs = np.asarray(model.predict_proba(frame))[0]
    model_classes = list(getattr(model, "classes_", []))

    if uses_int_labels:
        labels = [
            class_order[int(c)] if 0 <= int(c) < len(class_order) else str(c)
            for c in model_classes
        ]
    elif model_classes:
        labels = [str(c) for c in model_classes]
    else:
        labels = [str(c) for c in class_order]

    ranked = sorted(
        (
            {"disease": labels[i], "confidence": float(probs[i])}
            for i in range(len(labels))
        ),
        key=lambda item: item["confidence"],
        reverse=True,
    )
    return ranked[:limit]


def build_fallback_diets(selected_symptoms: List[str]) -> List[str]:
    symptom_set = set(selected_symptoms)
    suggestions: List[str] = []
    if {"diarrhea", "vomiting", "nausea"} & symptom_set:
        suggestions.append("Use ORS, coconut water, khichdi, bananas, and toast for easy digestion.")
    if {"fever", "fatigue"} & symptom_set:
        suggestions.append("Prefer warm fluids, protein-rich meals, and vitamin C foods.")
    if {"cough", "sore_throat", "breathlessness"} & symptom_set:
        suggestions.append("Take warm soups, ginger-tulsi tea, and avoid cold packaged drinks.")
    suggestions.extend(item for item in GENERIC_DIETS if item not in suggestions)
    return suggestions[:5]


def build_fallback_workouts(selected_symptoms: List[str]) -> List[str]:
    symptom_set = set(selected_symptoms)
    suggestions: List[str] = []
    if {"breathlessness", "cough"} & symptom_set:
        suggestions.append("Perform diaphragmatic breathing and pursed-lip breathing exercises.")
    if {"body_pain", "fatigue"} & symptom_set:
        suggestions.append("Do low-impact stretching and avoid high-intensity workouts.")
    if {"dizziness", "fever"} & symptom_set:
        suggestions.append("Prioritize rest and only do short slow walks after symptoms reduce.")
    suggestions.extend(item for item in GENERIC_WORKOUTS if item not in suggestions)
    return suggestions[:5]


def enrich_details(details: dict, selected_symptoms: List[str]) -> dict:
    enriched = {
        "description": details.get("description") or "No details available for this disease.",
        "diets": details.get("diets") or [],
        "workouts": details.get("workouts") or [],
        "precautions": details.get("precautions") or [],
        "medications": details.get("medications") or [],
        "riskFactors": details.get("riskFactors") or [],
    }
    if not enriched["diets"]:
        enriched["diets"] = build_fallback_diets(selected_symptoms)
    if not enriched["workouts"]:
        enriched["workouts"] = build_fallback_workouts(selected_symptoms)
    return enriched


def run_prediction_with_artifacts(
    request: Dict[str, Any],
    payload: Dict[str, Any],
    details_lookup: Dict[str, Any],
) -> Dict[str, Any]:
    feature_columns = payload.get("feature_columns", [])
    binary_cols = payload.get("binary_features", [])

    row = build_feature_row(payload, request)
    frame = pd.DataFrame([row], columns=feature_columns)

    predictions = top_predictions(payload, frame, TOP_K)
    if not predictions:
        raise RuntimeError("Model returned no predictions")

    predicted = predictions[0]["disease"]
    confidence = predictions[0]["confidence"]

    selected_symptoms = [col for col in binary_cols if row.get(col) == 1]
    default_details = {
        "description": "No details available for this disease.",
        "diets": [], "workouts": [], "precautions": [], "medications": [], "riskFactors": [],
    }
    final_details = enrich_details(
        details_lookup.get(predicted, default_details), selected_symptoms
    )

    return {
        "predictedDisease": predicted,
        "confidence": confidence,
        "topPredictions": predictions,
        "selectedSymptoms": selected_symptoms,
        "details": final_details,
    }

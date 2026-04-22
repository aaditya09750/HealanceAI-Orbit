"""Symptom-disease training pipeline (Phase 2 rebuild).

Key differences vs the original:
  - Trains on `data/merged_dataset.csv` (~8k rows) built by build_dataset.py,
    which includes 25 contextual feature columns on top of the 16 binary
    symptoms. If the merged dataset is missing, falls back to the
    original 1,500-row binary-only CSV so this script still runs end-to-end.
  - Uses a `ColumnTransformer` so numeric features are scaled, categorical
    features are one-hot encoded, and binary features pass through. This
    is saved alongside the model so inference re-uses the exact same
    transformation at predict time.
  - Adds XGBoost to the existing RF/ET/LogReg bake-off.
  - Wraps the winning model in `CalibratedClassifierCV` (isotonic) so the
    reported probabilities are meaningful, not just softmax-ish scores.
  - Reports top-1 and top-3 accuracy, selects the winner by top-3 score.
  - Estimates Expected Calibration Error (ECE) on the held-out test set.

Run:
    python train_symptom_model.py
"""

from __future__ import annotations

import ast
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    top_k_accuracy_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

try:
    from xgboost import XGBClassifier  # type: ignore
    HAS_XGB = True
except Exception:  # pragma: no cover
    HAS_XGB = False

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MERGED_CSV = BASE_DIR / "data" / "merged_dataset.csv"
LEGACY_CSV = BASE_DIR / "disease_dataset_1500_rows.csv"
DESCRIPTION_PATH = BASE_DIR / "updated_description_dataset.csv"
DIET_PATH = BASE_DIR / "diets.csv"
WORKOUT_PATH = BASE_DIR / "workout.csv"
PRECAUTION_PATH = BASE_DIR / "updated_precautions_dataset.csv"
MEDICATION_PATH = BASE_DIR / "medications.csv"
RISK_FACTORS_PATH = BASE_DIR / "disease_riskFactors.csv"

MODEL_PATH = MODELS_DIR / "symptom_disease_model.pkl"
DETAILS_PATH = MODELS_DIR / "disease_details.json"
METRICS_PATH = MODELS_DIR / "training_metrics.json"

BINARY_COLS = [
    "fever", "cough", "headache", "fatigue", "vomiting", "chest_pain",
    "sore_throat", "breathlessness", "nausea", "dizziness", "body_pain",
    "diarrhea", "skin_rash", "itching", "weight_loss", "sweating",
]

# Contextual columns that are numeric
NUMERIC_CTX_COLS = [
    "fever_temp_f",
    "vomiting_frequency_per_day",
    "diarrhea_frequency",
]

# Contextual columns that are categorical (one-hot encoded). Any value
# including "unknown" is valid.
CATEGORICAL_CTX_COLS = [
    "fever_duration_days",
    "fever_chills",
    "cough_type",
    "cough_duration_days",
    "cough_blood",
    "headache_severity",
    "headache_sudden",
    "fatigue_duration",
    "vomiting_blood",
    "chest_pain_character",
    "chest_pain_radiates",
    "breathlessness_severity",
    "nausea_duration",
    "dizziness_fainting",
    "diarrhea_blood",
    "diarrhea_dehydration",
    "weight_loss_amount",
    "sweating_night",
    "general_duration",
    "general_travel",
]

# Boolean "did user mention this food recently" columns (0/1)
FOOD_MULTIHOT_COLS = [
    "recent_food_street",
    "recent_food_seafood",
    "recent_food_leftovers",
]


# ─── Helpers copied from the original training script (kept for details
#     side-table build) ────────────────────────────────────────────────

def normalize_disease_name(value: str) -> str:
    return str(value or "").strip().lower()


def read_csv_with_fallback(path: Path) -> pd.DataFrame:
    try:
        return pd.read_csv(path)
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin1")


def parse_list_cell(value):
    if pd.isna(value):
        return []
    text = str(value).strip()
    if not text:
        return []
    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except Exception:
        pass
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    return [item.strip(" ' \"") for item in text.split(",") if item.strip(" ' \"")]


def build_disease_details(known_diseases):
    details = {
        disease: {
            "description": "",
            "diets": [],
            "workouts": [],
            "precautions": [],
            "medications": [],
            "riskFactors": [],
        }
        for disease in known_diseases
    }
    name_to_original = {normalize_disease_name(n): n for n in known_diseases}

    if DESCRIPTION_PATH.exists():
        for _, row in read_csv_with_fallback(DESCRIPTION_PATH).iterrows():
            key = normalize_disease_name(row.get("disease"))
            if key in name_to_original:
                details[name_to_original[key]]["description"] = str(row.get("description") or "").strip()

    if DIET_PATH.exists():
        for _, row in read_csv_with_fallback(DIET_PATH).iterrows():
            key = normalize_disease_name(row.get("Disease"))
            if key in name_to_original:
                details[name_to_original[key]]["diets"] = parse_list_cell(row.get("Diet"))

    if WORKOUT_PATH.exists():
        for _, row in read_csv_with_fallback(WORKOUT_PATH).iterrows():
            key = normalize_disease_name(row.get("Disease"))
            if key in name_to_original:
                details[name_to_original[key]]["workouts"] = parse_list_cell(row.get("Workouts"))

    if PRECAUTION_PATH.exists():
        for _, row in read_csv_with_fallback(PRECAUTION_PATH).iterrows():
            key = normalize_disease_name(row.get("disease"))
            if key in name_to_original:
                values = [
                    str(row.get("precaution_1") or "").strip(),
                    str(row.get("precaution_2") or "").strip(),
                    str(row.get("precaution_3") or "").strip(),
                    str(row.get("precaution_4") or "").strip(),
                ]
                details[name_to_original[key]]["precautions"] = [v for v in values if v]

    if MEDICATION_PATH.exists():
        for _, row in read_csv_with_fallback(MEDICATION_PATH).iterrows():
            key = normalize_disease_name(row.get("Disease"))
            if key in name_to_original:
                details[name_to_original[key]]["medications"] = parse_list_cell(row.get("Medication"))

    if RISK_FACTORS_PATH.exists():
        for _, row in read_csv_with_fallback(RISK_FACTORS_PATH).iterrows():
            key = normalize_disease_name(row.get("DNAME"))
            if key in name_to_original:
                risks_text = str(row.get("RISKFAC") or "").strip()
                details[name_to_original[key]]["riskFactors"] = parse_list_cell(risks_text) or [
                    item.strip() for item in risks_text.split(",") if item.strip()
                ]

    return details


# ─── Dataset loading ────────────────────────────────────────────────

def load_dataset() -> tuple[pd.DataFrame, list[str], list[str], list[str], list[str]]:
    """Return (df, binary_cols, numeric_ctx, categorical_ctx, food_cols).
    Uses merged dataset when available, else falls back to the legacy
    16-binary CSV (in which case ctx/food columns are all empty)."""
    if MERGED_CSV.exists():
        df = pd.read_csv(MERGED_CSV)
    else:
        print(f"[warn] merged dataset not found at {MERGED_CSV}, falling back to {LEGACY_CSV}")
        df = pd.read_csv(LEGACY_CSV)

    df.columns = [c.strip() for c in df.columns]

    for col in BINARY_COLS:
        if col not in df.columns:
            raise ValueError(f"Required binary column missing: {col}")
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    # Ensure all ctx cols exist; if missing, fill with safe defaults
    for col in NUMERIC_CTX_COLS:
        if col not in df.columns:
            df[col] = 0.0
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    for col in CATEGORICAL_CTX_COLS:
        if col not in df.columns:
            df[col] = "unknown"
        else:
            df[col] = df[col].astype(str).fillna("unknown").replace("nan", "unknown")
    for col in FOOD_MULTIHOT_COLS:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    df["disease"] = df["disease"].astype(str).str.strip()
    df = df[df["disease"] != ""].reset_index(drop=True)

    return df, BINARY_COLS, NUMERIC_CTX_COLS, CATEGORICAL_CTX_COLS, FOOD_MULTIHOT_COLS


# ─── Column transformer ────────────────────────────────────────────

def build_preprocessor(
    binary_cols: list[str],
    numeric_ctx: list[str],
    categorical_ctx: list[str],
    food_cols: list[str],
) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("binary", "passthrough", binary_cols),
            ("food", "passthrough", food_cols),
            ("numeric", StandardScaler(), numeric_ctx),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_ctx),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


# ─── Training / bake-off ───────────────────────────────────────────

def build_candidates(classes: np.ndarray) -> dict:
    candidates: dict = {
        "random_forest": RandomForestClassifier(
            n_estimators=500,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1,
            class_weight="balanced",
        ),
        "extra_trees": ExtraTreesClassifier(
            n_estimators=600,
            max_depth=None,
            random_state=42,
            n_jobs=-1,
            class_weight="balanced",
        ),
        "logistic_regression": LogisticRegression(
            max_iter=2500,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        ),
    }
    if HAS_XGB:
        candidates["xgboost"] = XGBClassifier(
            n_estimators=600,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            num_class=len(classes),
            random_state=42,
            tree_method="hist",
            eval_metric="mlogloss",
            n_jobs=-1,
        )
    return candidates


def expected_calibration_error(y_true_indices: np.ndarray, probabilities: np.ndarray, n_bins: int = 10) -> float:
    """Standard ECE for multi-class top-1 confidence."""
    confidences = probabilities.max(axis=1)
    predictions = probabilities.argmax(axis=1)
    accuracies = (predictions == y_true_indices).astype(float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        low, high = bins[i], bins[i + 1]
        mask = (confidences > low) & (confidences <= high)
        if not np.any(mask):
            continue
        bin_acc = accuracies[mask].mean()
        bin_conf = confidences[mask].mean()
        ece += (mask.sum() / len(confidences)) * abs(bin_acc - bin_conf)
    return float(ece)


def main() -> None:
    df, binary_cols, numeric_ctx, categorical_ctx, food_cols = load_dataset()

    feature_cols = binary_cols + food_cols + numeric_ctx + categorical_ctx
    X = df[feature_cols]
    y = df["disease"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )

    preprocessor = build_preprocessor(binary_cols, numeric_ctx, categorical_ctx, food_cols)
    classes = np.array(sorted(y.unique()))
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Encode target labels for the CV loop (needed for top_k_accuracy_score)
    class_to_idx = {c: i for i, c in enumerate(classes)}
    y_train_idx = y_train.map(class_to_idx).values
    y_test_idx = y_test.map(class_to_idx).values

    candidates = build_candidates(classes)
    leaderboard: dict[str, dict] = {}
    best_name: str | None = None
    best_score = -1.0
    best_pipeline: Pipeline | None = None

    for name, estimator in candidates.items():
        print(f"[train] Training {name}…")
        if name == "xgboost":
            # XGBoost expects integer labels
            pipeline = Pipeline([
                ("preprocessor", preprocessor),
                ("model", estimator),
            ])
        else:
            pipeline = Pipeline([
                ("preprocessor", preprocessor),
                ("model", estimator),
            ])

        # 5-fold CV top-3 accuracy on the training set
        fold_top3 = []
        fold_top1 = []
        for train_idx, val_idx in cv.split(X_train, y_train):
            X_tr, X_va = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr_idx = y_train_idx[train_idx]
            y_va_idx = y_train_idx[val_idx]
            if name == "xgboost":
                pipeline.fit(X_tr, y_tr_idx)
            else:
                pipeline.fit(X_tr, y_train.iloc[train_idx])
            if hasattr(pipeline, "predict_proba"):
                if name == "xgboost":
                    proba = pipeline.predict_proba(X_va)
                    # xgboost's classes are 0..N-1 in numeric order; our class_to_idx uses sorted class names
                    fold_top1.append(top_k_accuracy_score(y_va_idx, proba, k=1, labels=np.arange(len(classes))))
                    fold_top3.append(top_k_accuracy_score(y_va_idx, proba, k=3, labels=np.arange(len(classes))))
                else:
                    proba = pipeline.predict_proba(X_va)
                    labels_in_model = pipeline.named_steps["model"].classes_
                    model_idx_by_class = {c: i for i, c in enumerate(labels_in_model)}
                    # Remap proba columns to our canonical class order
                    remapped = np.zeros_like(proba)
                    for i, c in enumerate(classes):
                        if c in model_idx_by_class:
                            remapped[:, i] = proba[:, model_idx_by_class[c]]
                    fold_top1.append(top_k_accuracy_score(y_va_idx, remapped, k=1, labels=np.arange(len(classes))))
                    fold_top3.append(top_k_accuracy_score(y_va_idx, remapped, k=3, labels=np.arange(len(classes))))

        mean_top1 = float(np.mean(fold_top1))
        mean_top3 = float(np.mean(fold_top3))
        leaderboard[name] = {
            "cv_top1": round(mean_top1, 4),
            "cv_top3": round(mean_top3, 4),
        }
        print(f"  CV top-1={mean_top1:.4f}  top-3={mean_top3:.4f}")

        # Select winner by top-3 (since the UI shows top-3)
        if mean_top3 > best_score:
            best_score = mean_top3
            best_name = name
            # Fit on full train set for final model
            if name == "xgboost":
                pipeline.fit(X_train, y_train_idx)
            else:
                pipeline.fit(X_train, y_train)
            best_pipeline = pipeline

    assert best_name is not None and best_pipeline is not None

    # ── Wrap best pipeline in isotonic calibration for reliable probabilities.
    #    Using prefit requires an additional held-out set, so we re-fit a cloned
    #    pipeline inside CalibratedClassifierCV via cv=3 for proper calibration.
    print(f"[train] Calibrating winner ({best_name}) with isotonic CV=3…")
    if best_name == "xgboost":
        # XGB needs integer labels
        calibration_base = build_candidates(classes)["xgboost"]
        calibration_pipeline = Pipeline([
            ("preprocessor", build_preprocessor(binary_cols, numeric_ctx, categorical_ctx, food_cols)),
            ("model", calibration_base),
        ])
        calibrated = CalibratedClassifierCV(
            calibration_pipeline, method="isotonic", cv=3,
        )
        calibrated.fit(X_train, y_train_idx)
        # For XGB we expose classes via the numeric-to-name map
        # but CalibratedClassifierCV's .classes_ reports numeric, so we wrap
        # the final model with a tiny adapter in the payload.
        y_proba_test = calibrated.predict_proba(X_test)
        y_pred_test_idx = y_proba_test.argmax(axis=1)
        y_pred_test = np.array([classes[i] for i in y_pred_test_idx])
        final_class_order = list(classes)
    else:
        calibration_base_raw = build_candidates(classes)[best_name]
        calibration_pipeline = Pipeline([
            ("preprocessor", build_preprocessor(binary_cols, numeric_ctx, categorical_ctx, food_cols)),
            ("model", calibration_base_raw),
        ])
        calibrated = CalibratedClassifierCV(
            calibration_pipeline, method="isotonic", cv=3,
        )
        calibrated.fit(X_train, y_train)
        y_proba_test = calibrated.predict_proba(X_test)
        final_class_order = list(calibrated.classes_)
        y_pred_test = calibrated.predict(X_test)

    # Remap test probabilities to the canonical class order for top-k metrics
    remapped_test = np.zeros((len(X_test), len(classes)))
    for i, c in enumerate(classes):
        if c in final_class_order:
            j = final_class_order.index(c)
            remapped_test[:, i] = y_proba_test[:, j]

    test_top1 = float(top_k_accuracy_score(y_test_idx, remapped_test, k=1, labels=np.arange(len(classes))))
    test_top3 = float(top_k_accuracy_score(y_test_idx, remapped_test, k=3, labels=np.arange(len(classes))))
    test_accuracy = float(accuracy_score(y_test, y_pred_test))
    test_f1 = float(f1_score(y_test, y_pred_test, average="weighted", zero_division=0))
    ece = expected_calibration_error(y_test_idx, remapped_test)

    print("[train] Test metrics")
    print(f"  top-1 = {test_top1:.4f}")
    print(f"  top-3 = {test_top3:.4f}")
    print(f"  accuracy = {test_accuracy:.4f}")
    print(f"  f1_weighted = {test_f1:.4f}")
    print(f"  ECE = {ece:.4f}")

    # ── Persist model payload. For XGBoost we store the calibrated wrapper
    #    plus the class name list so the predict script can translate
    #    numeric labels back to disease names.
    payload = {
        "model": calibrated,
        "selected_model": best_name,
        "binary_features": binary_cols,
        "numeric_features": numeric_ctx,
        "categorical_features": categorical_ctx,
        "food_features": food_cols,
        "feature_columns": feature_cols,
        "classes": list(classes),
        "uses_integer_labels": best_name == "xgboost",
    }
    joblib.dump(payload, MODEL_PATH)

    # Build / refresh the side-table of disease descriptions.
    details = build_disease_details(classes.tolist())
    DETAILS_PATH.write_text(json.dumps(details, indent=2), encoding="utf-8")

    metrics = {
        "selected_model": best_name,
        "records": int(len(df)),
        "binary_features": len(binary_cols),
        "numeric_features": len(numeric_ctx),
        "categorical_features": len(categorical_ctx),
        "classes": len(classes),
        "leaderboard": leaderboard,
        "test_top1": round(test_top1, 4),
        "test_top3": round(test_top3, 4),
        "test_accuracy": round(test_accuracy, 4),
        "test_f1_weighted": round(test_f1, 4),
        "expected_calibration_error": round(ece, 4),
        "classification_report": classification_report(
            y_test, y_pred_test, output_dict=True, zero_division=0
        ),
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"[train] Wrote {MODEL_PATH}")
    print(f"[train] Wrote {METRICS_PATH}")


if __name__ == "__main__":
    main()

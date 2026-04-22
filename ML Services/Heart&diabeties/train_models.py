import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train_diabetes_model() -> dict:
    dataset_path = BASE_DIR / "cleaned_diabetes_dataset.csv"
    df = pd.read_csv(dataset_path)

    df["glucose"] = pd.to_numeric(df["glucose"], errors="coerce")
    df["bmi"] = pd.to_numeric(df["bmi"], errors="coerce")
    df["age"] = pd.to_numeric(df["age"], errors="coerce")
    df["target"] = pd.to_numeric(df["target"], errors="coerce")

    df = df.dropna(subset=["glucose", "bmi", "age", "target"])

    X = df[["age", "glucose", "bmi"]]
    y = df["target"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    candidates = {
        "logistic_regression": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("model", LogisticRegression(max_iter=1500, class_weight="balanced", random_state=42)),
            ]
        ),
        "random_forest": RandomForestClassifier(class_weight="balanced", random_state=42),
    }

    params = {
        "logistic_regression": {
            "model__C": [0.1, 1.0, 3.0, 10.0],
            "model__solver": ["liblinear", "lbfgs"],
        },
        "random_forest": {
            "n_estimators": [150, 250, 400],
            "max_depth": [None, 5, 10],
            "min_samples_split": [2, 5],
        },
    }

    best_name = None
    best_estimator = None
    best_accuracy = -1.0

    for name, model in candidates.items():
        grid = GridSearchCV(
            estimator=model,
            param_grid=params[name],
            scoring="accuracy",
            cv=5,
            n_jobs=1,
        )
        grid.fit(X_train, y_train)
        preds = grid.best_estimator_.predict(X_test)
        acc = accuracy_score(y_test, preds)

        if acc > best_accuracy:
            best_accuracy = acc
            best_name = name
            best_estimator = grid.best_estimator_

    model_payload = {
        "model": best_estimator,
        "features": ["age", "glucose", "bmi"],
        "label_map": {0: "No Risk", 1: "Risk"},
    }
    joblib.dump(model_payload, MODELS_DIR / "diabetes_model.joblib")

    final_preds = best_estimator.predict(X_test)
    return {
        "algorithm": best_name,
        "accuracy": round(float(accuracy_score(y_test, final_preds)), 4),
        "classification_report": classification_report(y_test, final_preds, output_dict=True),
    }


def train_heart_model() -> dict:
    dataset_path = BASE_DIR / "cleaned_heart_dataset.csv"
    df = pd.read_csv(dataset_path)

    column_map = {
        "sex": "gender",
        "resting_blood_pressure": "blood_pressure",
        "fasting_blood_sugar": "fbs",
    }
    df = df.rename(columns=column_map)

    df["fbs"] = (
        df["fbs"]
        .astype(str)
        .str.strip()
        .str.lower()
        .map({"true": 1, "false": 0, "1": 1, "0": 0})
    )

    for col in ["age", "gender", "blood_pressure", "cholesterol", "fbs", "target"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["age", "gender", "blood_pressure", "cholesterol", "fbs", "target"])

    X = df[["age", "gender", "blood_pressure", "cholesterol", "fbs"]]
    y = df["target"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    candidates = {
        "logistic_regression": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("model", LogisticRegression(max_iter=1500, class_weight="balanced", random_state=42)),
            ]
        ),
        "poly_logistic_regression": Pipeline(
            steps=[
                ("poly", PolynomialFeatures(degree=2, include_bias=False)),
                ("scaler", StandardScaler()),
                ("model", LogisticRegression(max_iter=3000, class_weight="balanced", random_state=42)),
            ]
        ),
        "random_forest": RandomForestClassifier(class_weight="balanced", random_state=42),
    }

    params = {
        "logistic_regression": {
            "model__C": [0.1, 1.0, 3.0, 10.0],
            "model__solver": ["liblinear", "lbfgs"],
        },
        "poly_logistic_regression": {
            "model__C": [0.1, 1.0, 3.0, 10.0],
            "model__solver": ["liblinear", "lbfgs"],
        },
        "random_forest": {
            "n_estimators": [150, 250, 400],
            "max_depth": [None, 5, 10],
            "min_samples_split": [2, 5],
        },
    }

    best_name = None
    best_estimator = None
    best_accuracy = -1.0

    for name, model in candidates.items():
        grid = GridSearchCV(
            estimator=model,
            param_grid=params[name],
            scoring="accuracy",
            cv=5,
            n_jobs=1,
        )
        grid.fit(X_train, y_train)
        preds = grid.best_estimator_.predict(X_test)
        acc = accuracy_score(y_test, preds)

        if acc > best_accuracy:
            best_accuracy = acc
            best_name = name
            best_estimator = grid.best_estimator_

    model_payload = {
        "model": best_estimator,
        "features": ["age", "gender", "blood_pressure", "cholesterol", "fbs"],
        "label_map": {0: "No Risk", 1: "Risk"},
    }
    joblib.dump(model_payload, MODELS_DIR / "heart_model.joblib")

    final_preds = best_estimator.predict(X_test)
    return {
        "algorithm": best_name,
        "accuracy": round(float(accuracy_score(y_test, final_preds)), 4),
        "classification_report": classification_report(y_test, final_preds, output_dict=True),
    }


def main() -> None:
    diabetes_metrics = train_diabetes_model()
    heart_metrics = train_heart_model()

    metrics = {
        "diabetes": diabetes_metrics,
        "heart": heart_metrics,
    }

    metrics_path = MODELS_DIR / "training_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print("Models trained successfully.")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()

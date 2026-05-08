"""HealanceAI ML inference service (FastAPI).

Two endpoints:
  POST /predict/heart-diabetes   - {modelType, features}
  POST /predict/symptom-disease  - {features?, context?, symptoms?}

The symptom-disease 44 MB artifact is loaded once during the lifespan
startup and held in module state. Heart and diabetes models are tiny
and lazy-loaded on first call.

Auth: requests must carry header `X-ML-Service-Token` matching the
`ML_SERVICE_TOKEN` environment variable. If the env var is empty the
check is skipped (for local development only).
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from heart_diabetes_predict import run_prediction as run_hd
from symptom_disease_predict import (
    load_artifacts as load_symptom_artifacts,
    run_prediction_with_artifacts as run_symptom,
)

ML_SERVICE_TOKEN = os.environ.get("ML_SERVICE_TOKEN", "")

# CORS allowlist — Vercel production frontend + local dev origins.
# /health is anonymous; predictions still authenticate via the
# X-ML-Service-Token header listed below.
ALLOWED_ORIGINS = [
    "https://healance-ai-orbit.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
]

_state: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    payload, details = load_symptom_artifacts()
    _state["symptom_payload"] = payload
    _state["symptom_details"] = details
    yield
    _state.clear()


app = FastAPI(title="HealanceAI ML", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-ML-Service-Token"],
    max_age=3600,
)


def _check_token(token: Optional[str]) -> None:
    if not ML_SERVICE_TOKEN:
        return
    if token != ML_SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid ML service token")


class HeartDiabetesPayload(BaseModel):
    modelType: str
    features: Dict[str, Any]


class SymptomDiseasePayload(BaseModel):
    features: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
    symptoms: Optional[List[str]] = None


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "models_loaded": "symptom_payload" in _state,
    }


@app.post("/predict/heart-diabetes")
def predict_heart_diabetes(
    body: HeartDiabetesPayload,
    x_ml_service_token: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    _check_token(x_ml_service_token)
    try:
        return run_hd(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/predict/symptom-disease")
def predict_symptom_disease(
    body: SymptomDiseasePayload,
    x_ml_service_token: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    _check_token(x_ml_service_token)
    try:
        return run_symptom(
            body.model_dump(exclude_none=False),
            payload=_state["symptom_payload"],
            details_lookup=_state["symptom_details"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except KeyError:
        raise HTTPException(status_code=503, detail="Symptom model not loaded")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

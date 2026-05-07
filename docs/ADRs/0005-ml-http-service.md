# ADR-0005: ML inference moves to a standalone FastAPI service called over HTTP

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** maintainers
- **Supersedes:** [ADR-0004](0004-ml-subprocess-bridge.md)

## Context

Free-tier deployment on Render exposed two hard limits in the subprocess bridge:

1. Render's Node runtime has no Python interpreter, so `child_process.spawn('python', ...)` cannot work in production without bundling Python via Docker.
2. A 512 MB free Node dyno cannot reliably hold Node + scikit-learn + xgboost + a 44 MB symptom-disease pickle in one process under concurrency.

Spawning a fresh Python interpreter per request also re-loaded every model on every prediction — a non-trivial cost the original ADR accepted when the host could absorb it.

Once we needed two services on Render anyway (Node web + something that runs Python), keeping the bridge in-process no longer simplified the deploy.

## Decision

Run inference as a separate **Render Web Service (Python)** behind a FastAPI app:

- New directory `ML Services02/` holds `app.py`, the two extracted prediction modules, `requirements.txt`, `runtime.txt`, and `models/` artifacts.
- Models load **once at FastAPI lifespan startup** (the 44 MB symptom artifact in particular).
- Endpoints: `GET /health`, `POST /predict/heart-diabetes`, `POST /predict/symptom-disease`.
- Authenticated via shared-secret header `X-ML-Service-Token`.
- `Backend/utils/mlPredictor.js` is rewritten to use the global `fetch` and routes to the right endpoint by script-path basename — preserving the existing controller signatures so `predictController.js` did not need to change.
- Configurable via env: `ML_SERVICE_URL`, `ML_SERVICE_TOKEN`, `ML_TIMEOUT_MS` (default 25 s).
- Original `ML Services/` directory is preserved for training scripts and datasets but is no longer on the runtime path.

## Consequences

**Positive**

- Free-tier deployable: Node and Python now ship as separate Render web services.
- Per-request cost dominated by network RTT, not Python interpreter cold-start. Models live in memory after the first request.
- Independent scaling and restart envelope per tier.
- Each service gets its own 512 MB on free tier — comfortable for both.

**Negative**

- Two services to monitor instead of one. Both have independent cold-start costs after 15 min idle on free tier.
- The shared-secret header is the only authn between backend and ML; rotate `ML_SERVICE_TOKEN` on suspected leak.
- Cross-service version drift is possible — a model retrained against newer sklearn must be redeployed on the ML side.

**Operational notes**

- The 44 MB `symptom_disease_model.pkl` is committed to the repo and pulled on every Render build. If it grows past ~80 MB, switch to Git LFS or fetch-at-startup from object storage.
- `ML_SERVICE_URL` must be set on the backend; the call fails fast otherwise.
- Local development can either run the FastAPI service alongside the backend (`uvicorn app:app --port 8001`) or point `ML_SERVICE_URL` at the deployed Render URL.

**Revisit when**

- Inference traffic justifies a paid tier and we want to colocate Node + Python in a single Docker image to remove the second cold start.
- A model is exported to ONNX cleanly, removing the Python-only dependency.

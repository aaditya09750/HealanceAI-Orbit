# ADR-0004: ML inference via Python subprocess, not HTTP microservice or Node-native runtime

- **Status:** Accepted
- **Date:** 2026-04-25
- **Deciders:** maintainers

## Context

Heart-disease, diabetes, and symptom-to-disease predictions run against scikit-learn / pandas-based models trained in Python. The Express backend needs to call these models per request from authenticated dashboard users.

Considered alternatives:

1. **HTTP microservice** — wrap the Python models in FastAPI/Flask, deploy as a separate service, call via `fetch`.
2. **Node-native inference** — convert models to ONNX and run via `onnxruntime-node`.
3. **Python subprocess** via `child_process.spawn`, exchanging JSON over stdin/stdout.

## Decision

Use Python subprocess via [`Backend/utils/mlPredictor.js`](../../Backend/utils/mlPredictor.js):

- `spawn(pythonCommand, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] })`.
- `pythonCommand` resolved from `PYTHON_BIN` env var, falling back to `python` on Windows and `python3` elsewhere.
- The Node side serializes the input payload to JSON, writes it to stdin, and closes stdin.
- The Python script reads stdin, runs inference, writes a JSON object to stdout, and exits.
- The Node side concatenates stdout, parses the final JSON line, and resolves the promise. A non-zero exit code rejects with the captured stderr.

Models live under `ML Services/Heart&diabeties/` and `ML Services/Symtums_diseas/` (legacy directory names are intentionally preserved per [CLAUDE.md](../../CLAUDE.md) non-goals).

## Consequences

**Positive**

- Zero deployment surface beyond the existing Node process. No second service to provision, monitor, or secure.
- Models run in-tree; updating a model is a `git push` away.
- Deterministic isolation per request — each prediction gets a fresh interpreter, so model state cannot leak across users.

**Negative**

- **Cold-start cost per request.** Spawning a Python interpreter and re-loading scikit-learn / pandas takes hundreds of milliseconds. This is the dominant latency cost on every prediction.
- **No request batching.** Two concurrent prediction requests run two interpreters; throughput is bounded by CPU.
- **Implicit working directory.** The Python script inherits the Node process cwd; relative paths inside Python (model file loads, data CSVs) must be resolved with care.
- **Deployment binds Node and Python together.** The host (or container) must ship both runtimes plus all `requirements.txt` deps.

**Revisit when**

- p95 prediction latency exceeds the product budget (today: a few seconds is acceptable; a real-time use case would not be).
- Concurrent prediction load saturates a single host's CPU and horizontal scaling becomes the right answer — at that point an HTTP microservice with its own pool is warranted.
- A model is exported to ONNX cleanly, removing the Python-only dependency and unlocking Node-native inference.

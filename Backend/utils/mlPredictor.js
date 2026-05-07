import path from 'path';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || '').replace(/\/$/, '');
const ML_SERVICE_TOKEN = process.env.ML_SERVICE_TOKEN || '';
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 25000);

const callMlService = async (endpoint, payload) => {
  if (!ML_SERVICE_URL) {
    throw new Error('ML_SERVICE_URL is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  try {
    const res = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ML_SERVICE_TOKEN ? { 'X-ML-Service-Token': ML_SERVICE_TOKEN } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg = json?.detail || json?.error || text || `ML service ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    if (json?.error) {
      throw new Error(json.error);
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`ML service timed out after ${ML_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

export const runPythonScript = (scriptPath, payload) => {
  const base = path.basename(scriptPath || '').toLowerCase();
  if (base.includes('symptom')) {
    return callMlService('/predict/symptom-disease', payload);
  }
  return callMlService('/predict/heart-diabetes', payload);
};

const runPythonPrediction = (payload) => runPythonScript('predict.py', payload);

export default runPythonPrediction;

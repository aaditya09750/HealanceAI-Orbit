import path from 'path';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || '').replace(/\/$/, '');
const ML_SERVICE_TOKEN = process.env.ML_SERVICE_TOKEN || '';
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 45000);
const ML_RETRY_COUNT = Number(process.env.ML_RETRY_COUNT || 1);
const ML_RETRY_DELAY_MS = Number(process.env.ML_RETRY_DELAY_MS || 2000);

const isHtmlBody = (text) => {
  const trimmed = (text || '').trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const warmingError = (message = 'ML service is warming up. Please retry in a few seconds.') => {
  const err = new Error(message);
  err.code = 'ML_WARMING';
  err.transient = true;
  return err;
};

const callMlServiceOnce = async (endpoint, payload) => {
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

    // Render returns an HTML 502 page during cold start — never leak that to clients.
    if (isHtmlBody(text)) {
      throw warmingError();
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!res.ok) {
      const transient = res.status === 502 || res.status === 503 || res.status === 504;
      if (transient) {
        throw warmingError();
      }
      const msg = json?.detail || json?.error || `ML service returned ${res.status}`;
      const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      err.code = 'ML_ERROR';
      throw err;
    }

    if (json?.error) {
      throw new Error(json.error);
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw warmingError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

const callMlService = async (endpoint, payload) => {
  if (!ML_SERVICE_URL) {
    throw new Error('ML_SERVICE_URL is not configured');
  }
  let lastErr;
  for (let attempt = 0; attempt <= ML_RETRY_COUNT; attempt++) {
    try {
      return await callMlServiceOnce(endpoint, payload);
    } catch (err) {
      lastErr = err;
      if (!err.transient || attempt === ML_RETRY_COUNT) throw err;
      // Give the ML dyno time to finish booting before the retry.
      await sleep(ML_RETRY_DELAY_MS);
    }
  }
  throw lastErr;
};

// Fire-and-forget warmup ping to wake the ML dyno. Never throws.
export const warmupMlService = () => {
  if (!ML_SERVICE_URL) return Promise.resolve();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  return fetch(`${ML_SERVICE_URL}/health`, { signal: controller.signal })
    .catch(() => {})
    .finally(() => clearTimeout(timeout));
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

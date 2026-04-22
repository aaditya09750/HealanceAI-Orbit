/**
 * Groq LLM client — used for medical report analysis.
 *
 * Groq hosts Llama 3.x with an OpenAI-compatible API, so we reuse the
 * already-installed `openai` SDK by pointing it at Groq's base URL.
 *
 * Free tier limits (approximate, subject to change on console.groq.com):
 *   llama-3.3-70b-versatile: 30 RPM, 1,000 RPD, 12,000 TPM
 *   llama-3.1-8b-instant:    30 RPM, 14,400 RPD, 6,000 TPM
 *
 * We use 70B as primary (best medical reasoning) with 8B fallback on
 * errors. A small in-memory token bucket keeps us under the per-minute
 * limit.
 */

import OpenAI from 'openai';

const BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL_PRIMARY = 'llama-3.3-70b-versatile';
const MODEL_FALLBACK = 'llama-3.1-8b-instant';
const MAX_REQ_PER_MINUTE = 28; // one under the 30/min cap, for safety
const MAX_REPORT_TEXT_CHARS = 16000; // ~4k tokens, keeps us under context cap

let groqClient = null;

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    try {
      groqClient = new OpenAI({ apiKey, baseURL: BASE_URL });
    } catch (err) {
      console.error('[groq] init failed:', err.message);
      return null;
    }
  }
  return groqClient;
}

// ──────────────────────────────────────────────────────────────────
// Rate limiter — 28 req/min rolling window
// ──────────────────────────────────────────────────────────────────
const rateState = { minuteWindow: [] };
function checkRateLimit() {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  rateState.minuteWindow = rateState.minuteWindow.filter((t) => t > minuteAgo);
  if (rateState.minuteWindow.length >= MAX_REQ_PER_MINUTE) {
    return { ok: false, reason: 'minute-limit' };
  }
  rateState.minuteWindow.push(now);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────
// JSON schema for report analysis — described in the prompt since Groq's
// json_object mode doesn't enforce a schema (unlike Gemini's responseSchema).
// We rely on strict prompting + post-parse validation.
// ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a careful medical report analyzer for a patient health app.

RULES:
- NEVER diagnose. Use hedging language ("may indicate", "suggests", "consider").
- Extract ONLY information explicitly present in the report text.
- Return ONLY a JSON object matching the schema below. No prose, no markdown, no code fences.
- For ARRAY fields — if you cannot confidently extract any items, return an EMPTY ARRAY (open bracket, close bracket). NEVER emit placeholder entries like {"name":"Unknown"} or {"specialty":"Unknown"}. An empty array is always preferable to placeholder entries.
- For STRING fields — if the information is genuinely absent, use a short honest phrase (e.g. "Not specified in this report").
- Only suggest medications when the report clearly indicates a condition that has a well-known first-line medication class. If uncertain, return an empty suggestedMedications array.

REQUIRED JSON SCHEMA:
{
  "reportType": string,              // e.g. "Blood Test", "X-Ray", "Prescription", "Unknown"
  "summary": string,                 // 2-4 sentence plain-language overview
  "keyFindings": [                   // each observable metric
    {
      "metric": string,              // e.g. "LDL Cholesterol"
      "value": string,               // measured value with unit
      "normalRange": string,         // optional — only if stated
      "status": "normal" | "low" | "high" | "critical"
    }
  ],
  "flags": [                         // only moderate/high severity items
    { "severity": "low" | "moderate" | "high", "message": string }
  ],
  "recommendedActions": [string],    // 2-6 short next-step bullets
  "suggestedMedications": [          // generic/class names (e.g. "statin")
    { "name": string, "purpose": string }
  ],
  "suggestedSpecialists": [          // standard specialty names
    { "specialty": string, "reason": string }
  ]
}

Return ONLY the JSON object. Begin response with "{" and end with "}".`;

// Placeholder-ish values the LLM sometimes emits when it can't extract data.
// We strip items matching these so the UI never shows "Unknown" cards.
const PLACEHOLDER_VALUES = new Set([
  'unknown',
  'not specified',
  'not applicable',
  'n/a',
  'na',
  'none',
  'tbd',
  '',
]);

const isPlaceholder = (value) => {
  if (value == null) return true;
  const v = String(value).trim().toLowerCase();
  if (!v) return true;
  return PLACEHOLDER_VALUES.has(v);
};

function validateShape(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    reportType: typeof obj.reportType === 'string' ? obj.reportType : 'Medical Report',
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    keyFindings: Array.isArray(obj.keyFindings)
      ? obj.keyFindings.filter(
          (f) => f && typeof f === 'object' && !isPlaceholder(f.metric) && !isPlaceholder(f.value)
        )
      : [],
    flags: Array.isArray(obj.flags)
      ? obj.flags.filter((f) => f && typeof f === 'object' && !isPlaceholder(f.message))
      : [],
    recommendedActions: Array.isArray(obj.recommendedActions)
      ? obj.recommendedActions.filter((a) => typeof a === 'string' && !isPlaceholder(a))
      : [],
    suggestedMedications: Array.isArray(obj.suggestedMedications)
      ? obj.suggestedMedications.filter((m) => m && typeof m === 'object' && !isPlaceholder(m.name))
      : [],
    suggestedSpecialists: Array.isArray(obj.suggestedSpecialists)
      ? obj.suggestedSpecialists.filter(
          (s) => s && typeof s === 'object' && !isPlaceholder(s.specialty)
        )
      : [],
  };
}

async function callGroq(model, prompt) {
  const client = getClient();
  if (!client) return { error: 'no-client' };
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) return { error: 'empty-response' };
    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch {
      return { error: 'invalid-json', raw };
    }
  } catch (err) {
    console.error(`[groq:${model}] call failed:`, err.message);
    if (err.status) console.error(`[groq:${model}] status:`, err.status);
    if (err.error?.message) console.error(`[groq:${model}] error:`, err.error.message);
    return { error: 'api-error', message: err.message };
  }
}

/**
 * Analyze extracted report text and return a structured summary.
 * Returns null if the LLM is unavailable or both primary + fallback fail.
 * Returns `{ __rateLimited: 'minute-limit' }` when we would exceed the free tier.
 */
export async function analyzeReport(reportText) {
  if (!reportText || typeof reportText !== 'string' || reportText.trim().length < 40) {
    return null;
  }
  if (!getClient()) {
    console.warn('[groq] GROQ_API_KEY missing — skipping analysis');
    return null;
  }

  const rate = checkRateLimit();
  if (!rate.ok) {
    console.warn('[groq] rate limit reached:', rate.reason);
    return { __rateLimited: rate.reason };
  }

  const trimmed = reportText.slice(0, MAX_REPORT_TEXT_CHARS);
  const userPrompt = `--- REPORT TEXT BEGIN ---\n${trimmed}\n--- REPORT TEXT END ---\n\nReturn ONLY the JSON object.`;

  // Try primary model first
  let result = await callGroq(MODEL_PRIMARY, userPrompt);

  // On any failure (rate-limit, invalid-json, api-error), retry once on 8B fallback
  if (!result.ok) {
    console.warn(
      `[groq] primary (${MODEL_PRIMARY}) failed (${result.error}); retrying on ${MODEL_FALLBACK}`
    );
    result = await callGroq(MODEL_FALLBACK, userPrompt);
  }

  if (!result.ok) return null;
  return validateShape(result.data);
}

export function isGroqAvailable() {
  return !!process.env.GROQ_API_KEY;
}

// ──────────────────────────────────────────────────────────────────
// Adaptive questions — supplemental questions for novel or profile-aware
// cases. Returns an array of catalog-shaped question objects or [] on any
// failure. Kept intentionally small and cheap: we only invoke when a user
// has chronic conditions or active medications (see adaptiveQuestionGenerator).
// ──────────────────────────────────────────────────────────────────

const ADAPTIVE_QUESTIONS_SYSTEM_PROMPT = `You are a clinical triage assistant adding 1-2 supplemental follow-up questions for a symptom checker.

RULES:
- Only add questions that are not already obvious from the symptoms list.
- Prioritize safety-critical or condition-specific questions when the patient profile includes relevant chronic conditions or medications.
- Use simple, patient-facing language. No medical jargon.
- Never diagnose, never recommend medication.
- Return ONLY a JSON object with a "questions" array. No prose, no markdown, no code fences.

QUESTION OBJECT SCHEMA:
{
  "id": string,                       // snake_case, e.g. "diabetic_ketone_check"
  "symptom": string,                  // related symptom key or "personalized"
  "label": string,                    // the question text
  "type": "chip" | "number" | "multiselect",
  "options": string[],                // REQUIRED for chip/multiselect, 2-5 short options
  "unit": string,                     // REQUIRED for number
  "min": number, "max": number,       // REQUIRED for number
  "required": boolean,
  "priority": number,                 // 1-10, 10 = most important
  "redFlag": boolean                  // true only for clinically urgent checks
}

RESPONSE SHAPE: { "questions": [ ...0 to 2 items... ] }

If nothing valuable to add, return { "questions": [] }. Begin with "{" and end with "}".`;

const VALID_Q_TYPES = new Set(['chip', 'number', 'multiselect']);

function validateQuestionObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (!obj.id || !obj.label || !VALID_Q_TYPES.has(obj.type)) return null;
  const base = {
    id: String(obj.id).trim().toLowerCase().replace(/\s+/g, '_'),
    symptom: typeof obj.symptom === 'string' && obj.symptom ? obj.symptom : 'personalized',
    label: String(obj.label).trim(),
    type: obj.type,
    required: Boolean(obj.required),
    priority: Number.isFinite(obj.priority) ? Math.max(1, Math.min(10, obj.priority)) : 5,
  };
  if (obj.redFlag) base.redFlag = true;
  if (obj.type === 'number') {
    if (!obj.unit) return null;
    base.unit = String(obj.unit);
    if (Number.isFinite(obj.min)) base.min = obj.min;
    if (Number.isFinite(obj.max)) base.max = obj.max;
  }
  if (obj.type === 'chip' || obj.type === 'multiselect') {
    if (!Array.isArray(obj.options) || obj.options.length < 2) return null;
    base.options = obj.options
      .map((o) => String(o).trim())
      .filter(Boolean)
      .slice(0, 5);
    if (base.options.length < 2) return null;
  }
  return base;
}

export async function generateAdaptiveQuestions(symptoms, profile) {
  if (!Array.isArray(symptoms) || symptoms.length === 0) return [];
  if (!getClient()) return [];

  const rate = checkRateLimit();
  if (!rate.ok) return [];

  const safeProfile = {
    age: Number.isFinite(profile?.age) ? profile.age : null,
    gender: profile?.gender || null,
    medicalConditions: Array.isArray(profile?.medicalConditions)
      ? profile.medicalConditions.slice(0, 6)
      : [],
    medications: Array.isArray(profile?.medications) ? profile.medications.slice(0, 6) : [],
  };

  const userPrompt = `SELECTED SYMPTOMS: ${symptoms.join(', ')}
PATIENT PROFILE: ${JSON.stringify(safeProfile)}

Propose 1-2 supplemental questions (or none) that would meaningfully improve disease prediction accuracy for this specific patient. Return only JSON.`;

  const call = async (model) => {
    const client = getClient();
    if (!client) return { error: 'no-client' };
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: ADAPTIVE_QUESTIONS_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      const raw = completion?.choices?.[0]?.message?.content;
      if (!raw) return { error: 'empty-response' };
      try {
        return { ok: true, data: JSON.parse(raw) };
      } catch {
        return { error: 'invalid-json' };
      }
    } catch (err) {
      console.warn(`[groq:adaptive-q:${model}] failed:`, err.message);
      return { error: 'api-error' };
    }
  };

  let result = await call(MODEL_PRIMARY);
  if (!result.ok) result = await call(MODEL_FALLBACK);
  if (!result.ok) return [];

  const arr = Array.isArray(result.data?.questions) ? result.data.questions : [];
  return arr.map(validateQuestionObject).filter(Boolean).slice(0, 2);
}

// ──────────────────────────────────────────────────────────────────
// Rerank predictions — Tier B of the prediction refiner. Given the top-3
// predictions, contextual answers, and profile digest, return a possibly
// reordered top-3 with adjusted confidences. Returns [] on any failure.
// ──────────────────────────────────────────────────────────────────

const RERANK_SYSTEM_PROMPT = `You are a clinical decision-support re-ranker helping a triage app refine a symptom-based disease prediction.

You will be given:
- A selected symptom list (booleans)
- A short set of contextual answers (numbers, choices, multi-select) that the ML model could not see
- The top 3 candidate diseases with baseline confidence scores (0-1)
- A brief patient profile

Your task: decide whether the contextual answers meaningfully change which disease is most likely, and return a re-ranked list.

RULES:
- Never invent a new disease — only reorder and adjust confidence among the 3 given candidates.
- Confidence must stay between 0 and 1.
- Prefer small adjustments (±0.05 to ±0.15) unless the context is strongly discriminating.
- If the context does NOT meaningfully change the ranking, return the same 3 items in the same order with unchanged confidence.
- Never diagnose in free text. Keep "reasoning" brief (<= 20 words).
- Return ONLY a JSON object.

RESPONSE SHAPE:
{ "rankings": [
    { "disease": string, "confidence": number, "reasoning": string }
] }

Begin with "{" and end with "}".`;

// ──────────────────────────────────────────────────────────────────
// Disease prediction from symptoms — primary LLM predictor.
// Given selected symptoms + contextual answers + profile, returns up to
// 3 disease predictions drawn from the allowed-diseases catalog, each
// with a confidence and a one-line clinical reasoning. Returns [] on
// any failure (empty catalog, missing key, rate limit, parse error).
// ──────────────────────────────────────────────────────────────────

const DISEASE_PREDICTOR_SYSTEM_PROMPT = `You are a cautious clinical triage assistant for a consumer health app. Your job is to rank the most likely diseases from a provided catalog given a patient's symptoms, contextual answers, and profile.

RULES:
- Pick disease names ONLY from the allowedDiseases list provided in the user message. Use the exact "name" field as written. Do NOT invent names or use synonyms.
- Consider red-flag patterns (thunderclap headache, chest pain radiating to arm/jaw in older adults, blood in vomit/stool, breathing difficulty at rest, altered mental status) — these MUST push emergency diseases (Subarachnoid Hemorrhage, Bacterial Meningitis, Myocardial Infarction, Aortic Dissection, Pulmonary Embolism, etc.) into the top candidates.
- Confidence must be between 0 and 1. Favor spreading confidence realistically — a single very-likely disease may be 0.6–0.8; ambiguous cases 0.3–0.5 across 3 diseases.
- "reasoning" field: ONE short plain-language sentence (max ~25 words) that a non-medical adult can follow, explaining why this disease fits the pattern. Never diagnostic, always hedging ("suggests", "may indicate", "consistent with"). Never prescribe treatment.
- Never diagnose. Always frame output as possibilities for a clinician to confirm.
- Return ONLY a JSON object matching the schema. No prose, no markdown, no code fences.

REQUIRED JSON SCHEMA:
{
  "predictions": [
    { "disease": string, "confidence": number, "reasoning": string }
  ]
}

Return 1-3 predictions. Begin response with "{" and end with "}".`;

export async function predictWithAllowedDiseases({
  symptoms,
  contextualAnswers,
  profile,
  allowedDiseases,
}) {
  if (!Array.isArray(symptoms) || symptoms.length === 0) return [];
  if (!Array.isArray(allowedDiseases) || allowedDiseases.length === 0) return [];
  if (!getClient()) return [];

  const rate = checkRateLimit();
  if (!rate.ok) return [];

  const safeProfile = {
    age: Number.isFinite(profile?.age) ? profile.age : null,
    gender: profile?.gender || null,
    medicalConditions: Array.isArray(profile?.medicalConditions)
      ? profile.medicalConditions.slice(0, 6)
      : [],
    medications: Array.isArray(profile?.medications) ? profile.medications.slice(0, 6) : [],
  };

  // Send a compact catalog summary to minimise tokens: name + redFlagHints
  // (if any). The full catalog lives in allowedDiseases.json and the
  // controller hydrates the returned names with descriptions later.
  const compactCatalog = allowedDiseases.map((d) => ({
    name: d.name,
    redFlagHints: Array.isArray(d.redFlagHints) ? d.redFlagHints.slice(0, 2) : [],
    emergency: Boolean(d.emergency),
  }));

  const userPrompt = `SELECTED SYMPTOMS: ${symptoms.join(', ')}
CONTEXTUAL ANSWERS: ${JSON.stringify(contextualAnswers || {})}
PATIENT PROFILE: ${JSON.stringify(safeProfile)}
ALLOWED DISEASES (pick ONLY from this list, use the exact name):
${JSON.stringify(compactCatalog)}

Return 1-3 top predictions as JSON.`;

  const call = async (model) => {
    const client = getClient();
    if (!client) return { error: 'no-client' };
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: DISEASE_PREDICTOR_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.15,
      });
      const raw = completion?.choices?.[0]?.message?.content;
      if (!raw) return { error: 'empty-response' };
      try {
        return { ok: true, data: JSON.parse(raw) };
      } catch {
        return { error: 'invalid-json' };
      }
    } catch (err) {
      console.warn(`[groq:predict:${model}] failed:`, err.message);
      return { error: 'api-error' };
    }
  };

  let result = await call(MODEL_PRIMARY);
  if (!result.ok) result = await call(MODEL_FALLBACK);
  if (!result.ok) return [];

  const predictions = Array.isArray(result.data?.predictions) ? result.data.predictions : [];
  const allowedNames = new Set(allowedDiseases.map((d) => d.name));
  return predictions
    .map((p) => ({
      disease: String(p.disease || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(p.confidence))),
      reasoning: typeof p.reasoning === 'string' ? p.reasoning.trim() : '',
    }))
    .filter((p) => p.disease && allowedNames.has(p.disease) && Number.isFinite(p.confidence))
    .slice(0, 3);
}

// ──────────────────────────────────────────────────────────────────
// Clinical reviewer — merges ML + LLM candidate predictions into a
// final top-3 with reasoning. Given two lists of candidates, decides
// which deserve top spots, adjusts confidences, and returns per-disease
// one-line clinical reasoning. Returns [] on any failure.
// ──────────────────────────────────────────────────────────────────

const REVIEWER_SYSTEM_PROMPT = `You are a senior clinical reviewer reconciling two disease-prediction lists (one from a statistical model, one from a clinical reasoning AI) for a consumer triage app.

RULES:
- Pick the final top 3 disease names from the union of ML + LLM candidates plus the allowedDiseases list.
- Use disease names EXACTLY as written in the allowedDiseases list.
- Prioritize patient safety — if red-flag patterns are present but missing from both lists, you MAY add an emergency disease from allowedDiseases to the final top-3.
- Confidence must be between 0 and 1. Be realistic — not every top prediction is 0.9.
- "reasoning" field: ONE concise, patient-friendly sentence (max ~25 words) per disease explaining why it's in the top 3. Hedge language ("suggests", "consistent with"). Never prescribe.
- Return ONLY a JSON object.

SCHEMA:
{
  "rankings": [
    { "disease": string, "confidence": number, "reasoning": string }
  ]
}

Always return exactly 3 items if possible. Begin with "{" and end with "}".`;

export async function reviewCandidates({
  mlCandidates,
  llmCandidates,
  symptoms,
  contextualAnswers,
  profile,
  allowedDiseases,
}) {
  if (!getClient()) return [];
  if (!Array.isArray(allowedDiseases) || allowedDiseases.length === 0) return [];

  const rate = checkRateLimit();
  if (!rate.ok) return [];

  const safeProfile = {
    age: Number.isFinite(profile?.age) ? profile.age : null,
    gender: profile?.gender || null,
    medicalConditions: Array.isArray(profile?.medicalConditions)
      ? profile.medicalConditions.slice(0, 6)
      : [],
  };

  const compactCatalog = allowedDiseases.map((d) => ({
    name: d.name,
    redFlagHints: Array.isArray(d.redFlagHints) ? d.redFlagHints.slice(0, 2) : [],
    emergency: Boolean(d.emergency),
  }));

  const userPrompt = `SYMPTOMS: ${(symptoms || []).join(', ')}
CONTEXTUAL ANSWERS: ${JSON.stringify(contextualAnswers || {})}
PATIENT PROFILE: ${JSON.stringify(safeProfile)}
ML CANDIDATES (top-5): ${JSON.stringify((mlCandidates || []).slice(0, 5))}
LLM CANDIDATES (top-3): ${JSON.stringify((llmCandidates || []).slice(0, 3))}
ALLOWED DISEASES (authoritative name list):
${JSON.stringify(compactCatalog)}

Produce the final top-3 with reasoning as JSON.`;

  const call = async (model) => {
    const client = getClient();
    if (!client) return { error: 'no-client' };
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: REVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.15,
      });
      const raw = completion?.choices?.[0]?.message?.content;
      if (!raw) return { error: 'empty-response' };
      try {
        return { ok: true, data: JSON.parse(raw) };
      } catch {
        return { error: 'invalid-json' };
      }
    } catch (err) {
      console.warn(`[groq:reviewer:${model}] failed:`, err.message);
      return { error: 'api-error' };
    }
  };

  let result = await call(MODEL_PRIMARY);
  if (!result.ok) result = await call(MODEL_FALLBACK);
  if (!result.ok) return [];

  const rankings = Array.isArray(result.data?.rankings) ? result.data.rankings : [];
  const allowedNames = new Set(allowedDiseases.map((d) => d.name));
  return rankings
    .map((r) => ({
      disease: String(r.disease || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(r.confidence))),
      reasoning: typeof r.reasoning === 'string' ? r.reasoning.trim() : '',
    }))
    .filter((r) => r.disease && allowedNames.has(r.disease) && Number.isFinite(r.confidence))
    .slice(0, 3);
}

export async function rerankPredictions({ topPredictions, contextualAnswers, profile, symptoms }) {
  if (!Array.isArray(topPredictions) || topPredictions.length === 0) return [];
  if (!getClient()) return [];

  const rate = checkRateLimit();
  if (!rate.ok) return [];

  const safeProfile = {
    age: Number.isFinite(profile?.age) ? profile.age : null,
    gender: profile?.gender || null,
    medicalConditions: Array.isArray(profile?.medicalConditions)
      ? profile.medicalConditions.slice(0, 6)
      : [],
  };

  const userPrompt = `SYMPTOMS (selected): ${(symptoms || []).join(', ')}
CONTEXTUAL ANSWERS: ${JSON.stringify(contextualAnswers || {})}
PATIENT PROFILE: ${JSON.stringify(safeProfile)}
TOP 3 CANDIDATES: ${JSON.stringify(topPredictions.slice(0, 3))}

Re-rank the 3 candidates if the context meaningfully changes likelihood. Return JSON only.`;

  const call = async (model) => {
    const client = getClient();
    if (!client) return { error: 'no-client' };
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: RERANK_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
      const raw = completion?.choices?.[0]?.message?.content;
      if (!raw) return { error: 'empty-response' };
      try {
        return { ok: true, data: JSON.parse(raw) };
      } catch {
        return { error: 'invalid-json' };
      }
    } catch (err) {
      console.warn(`[groq:rerank:${model}] failed:`, err.message);
      return { error: 'api-error' };
    }
  };

  let result = await call(MODEL_PRIMARY);
  if (!result.ok) result = await call(MODEL_FALLBACK);
  if (!result.ok) return [];

  const rankings = Array.isArray(result.data?.rankings) ? result.data.rankings : [];
  return rankings
    .map((r) => ({
      disease: String(r.disease || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(r.confidence))),
    }))
    .filter((r) => r.disease && Number.isFinite(r.confidence))
    .slice(0, 3);
}

/**
 * Post-ML prediction refinement.
 *
 * The Python symptom model is trained on a fixed feature set of 16 booleans,
 * so we cannot feed contextual facts (temperature, duration, food exposure)
 * into it directly. Instead we run a two-tier refinement:
 *
 *   Tier A — deterministic rules (always runs). Cheap, predictable,
 *            auditable. Adjusts confidence on the top-3 predictions and
 *            re-ranks them when a rule meaningfully fires.
 *   Tier B — Groq LLM re-ranker (conditional). Only fires when Tier A did
 *            not disambiguate AND the top-1/top-2 confidence gap is small
 *            (<0.08). Cached by (symptoms+context+topLabels) signature to
 *            stay well under the Groq free-tier ceiling.
 *
 * Output is always a new predictions array of the same shape the Python
 * script returned (`[{ disease, confidence }]`) so the existing UI and
 * DB schema keep working.
 */

import crypto from 'crypto';
import { rerankPredictions as llmRerank } from './groqClient.js';
import { findCatalogEntry } from './llmDiseasePredictor.js';

// ──────────────────────────────────────────────────────────────────
// Rules — each rule inspects contextualAnswers (and optionally the
// profile) and returns an array of `{ label, delta, reason }` adjustments
// to be applied to any matching prediction. Label match is case-insensitive
// and uses substring for robustness against "Common Cold" vs "Common cold".
// ──────────────────────────────────────────────────────────────────

const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const listIncludes = (list, needle) => {
  if (!Array.isArray(list)) return false;
  const n = String(needle).toLowerCase();
  return list.some((item) => String(item).toLowerCase() === n);
};

const RULES = [
  {
    id: 'high_fever_long_duration',
    when: (ctx) => {
      const temp = asNumber(ctx.fever_temp_f);
      const dur = ctx.fever_duration_days;
      return temp !== null && temp >= 102 && (dur === '4-7' || dur === '>7');
    },
    adjustments: [
      { label: 'Influenza', delta: +0.1, reason: 'High sustained fever (≥102°F, 4+ days)' },
      { label: 'Malaria', delta: +0.08, reason: 'High sustained fever pattern' },
      { label: 'Common Cold', delta: -0.08, reason: 'Pattern too severe for common cold' },
    ],
  },
  {
    id: 'food_poisoning_signature',
    when: (ctx) => {
      const freq = asNumber(ctx.vomiting_frequency_per_day);
      const loose = asNumber(ctx.diarrhea_frequency);
      const food = ctx.recent_food;
      const unusualFood =
        listIncludes(food, 'Street food') ||
        listIncludes(food, 'Seafood') ||
        listIncludes(food, 'Leftovers');
      return unusualFood && ((freq !== null && freq >= 3) || (loose !== null && loose >= 3));
    },
    adjustments: [
      {
        label: 'Gastroenteritis',
        delta: +0.12,
        reason: 'Vomiting/diarrhea with suspicious food history',
      },
      { label: 'Food Poisoning', delta: +0.12, reason: 'Classic food-poisoning signature' },
    ],
  },
  {
    id: 'cardiac_chest_pain_signature',
    when: (ctx, profile) => {
      const radiates = String(ctx.chest_pain_radiates || '').toLowerCase() === 'yes';
      const exertional = String(ctx.chest_pain_trigger || '').toLowerCase() === 'yes';
      const pressure = String(ctx.chest_pain_character || '')
        .toLowerCase()
        .includes('pressure');
      const age = asNumber(profile?.age);
      const ageRisk = age !== null && age >= 45;
      return (radiates && (pressure || exertional)) || (radiates && ageRisk);
    },
    adjustments: [
      { label: 'Heart attack', delta: +0.15, reason: 'Classic cardiac chest-pain pattern' },
      { label: 'Angina', delta: +0.12, reason: 'Exertional pressure pain radiating' },
      { label: 'Hypertension', delta: +0.05, reason: 'Cardiac symptom cluster' },
    ],
  },
  {
    id: 'dehydration_flag',
    when: (ctx) => String(ctx.diarrhea_dehydration || '').toLowerCase() === 'yes',
    adjustments: [{ label: 'Gastroenteritis', delta: +0.06, reason: 'Signs of dehydration' }],
  },
  {
    id: 'thunderclap_headache',
    when: (ctx) => String(ctx.headache_sudden || '').toLowerCase() === 'yes',
    adjustments: [
      { label: 'Migraine', delta: -0.05, reason: 'Sudden-onset pattern less typical of migraine' },
      { label: 'Hypertension', delta: +0.06, reason: 'Thunderclap headache can be hypertensive' },
    ],
  },
  {
    id: 'night_sweats_with_weight_loss',
    when: (ctx) => {
      const sweatNight = String(ctx.sweating_night || '').toLowerCase() === 'yes';
      const weightAmount = ctx.weight_loss_amount;
      const unintentional = String(ctx.weight_loss_intentional || '').toLowerCase() === 'no';
      const significant = weightAmount === '5-10 kg' || weightAmount === '>10 kg';
      return sweatNight && unintentional && significant;
    },
    adjustments: [
      { label: 'Tuberculosis', delta: +0.1, reason: 'Night sweats with unintentional weight loss' },
      { label: 'Common Cold', delta: -0.05, reason: 'Pattern not consistent with a cold' },
    ],
  },
  {
    id: 'diabetic_ketoacidosis_flag',
    when: (ctx, profile) => {
      const conditions = (profile?.medicalConditions || []).map((c) => String(c).toLowerCase());
      const isDiabetic = conditions.some((c) => c.includes('diabet'));
      const vomiting = asNumber(ctx.vomiting_frequency_per_day);
      const breathless =
        ctx.breathlessness_severity && String(ctx.breathlessness_severity).toLowerCase() !== 'mild';
      return isDiabetic && ((vomiting !== null && vomiting >= 3) || breathless);
    },
    adjustments: [
      { label: 'Diabetes', delta: +0.1, reason: 'Diabetic with concerning acute symptoms' },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// Core Tier A — apply all firing rules to a top-N predictions array.
// Returns `{ predictions, hits }` where hits is the list of rules that
// actually matched a prediction label.
// ──────────────────────────────────────────────────────────────────

function labelMatches(predictionDisease, ruleLabel) {
  if (!predictionDisease || !ruleLabel) return false;
  const a = String(predictionDisease).toLowerCase();
  const b = String(ruleLabel).toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function clampConfidence(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function applyRules(predictions, ctx, profile) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return { predictions: predictions || [], hits: [] };
  }

  const working = predictions.map((p) => ({
    disease: p.disease,
    confidence: typeof p.confidence === 'number' ? p.confidence : 0,
  }));
  const hits = [];

  for (const rule of RULES) {
    let fired = false;
    try {
      if (!rule.when(ctx || {}, profile || {})) continue;
    } catch {
      continue;
    }
    for (const adj of rule.adjustments) {
      for (const p of working) {
        if (labelMatches(p.disease, adj.label)) {
          p.confidence = clampConfidence(p.confidence + adj.delta);
          fired = true;
        }
      }
    }
    if (fired) hits.push({ rule: rule.id, reasons: rule.adjustments.map((a) => a.reason) });
  }

  working.sort((a, b) => b.confidence - a.confidence);
  return { predictions: working, hits };
}

// ──────────────────────────────────────────────────────────────────
// Tier B — LLM re-ranker. Small in-memory LRU cache keyed by a hash of
// (symptoms|contextualAnswers|topLabels) with a 1-hour TTL. Also a
// server-wide 8 calls/min cap so a burst of ambiguous requests cannot
// exhaust the Groq minute quota.
// ──────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 256;
const MINUTE_CAP = 8;
const cache = new Map(); // key -> { at, value }
const minuteWindow = []; // timestamps of recent LLM calls

function makeSignature(symptoms, ctx, topPredictions) {
  const payload = {
    s: [...(symptoms || [])].sort(),
    c: Object.keys(ctx || {})
      .sort()
      .reduce((acc, k) => ((acc[k] = ctx[k]), acc), {}),
    t: (topPredictions || [])
      .slice(0, 3)
      .map((p) => p.disease)
      .sort(),
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // LRU bump
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { at: Date.now(), value });
}

function canCallLlm() {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  while (minuteWindow.length && minuteWindow[0] < minuteAgo) minuteWindow.shift();
  if (minuteWindow.length >= MINUTE_CAP) return false;
  minuteWindow.push(now);
  return true;
}

async function rerankWithLlm(predictions, ctx, profile, symptoms) {
  const signature = makeSignature(symptoms, ctx, predictions);
  const cached = cacheGet(signature);
  if (cached) return { predictions: cached, cached: true };

  if (!canCallLlm()) return null;

  try {
    const top = predictions.slice(0, 3);
    const reranked = await llmRerank({
      topPredictions: top,
      contextualAnswers: ctx || {},
      profile: profile || {},
      symptoms: symptoms || [],
    });
    if (!Array.isArray(reranked) || reranked.length === 0) return null;

    // Build the final list: use LLM output for top-3 then append any
    // original predictions not represented, so we never lose diseases the
    // model originally flagged.
    const picked = reranked
      .map((r) => ({
        disease: String(r.disease || r.label || ''),
        confidence: clampConfidence(Number(r.confidence)),
      }))
      .filter((p) => p.disease);

    const pickedNames = new Set(picked.map((p) => p.disease.toLowerCase()));
    const remaining = predictions.filter((p) => !pickedNames.has(String(p.disease).toLowerCase()));
    const merged = [...picked, ...remaining].sort((a, b) => b.confidence - a.confidence);

    cacheSet(signature, merged);
    return { predictions: merged, cached: false };
  } catch (err) {
    console.warn('[predictionRefiner] LLM rerank failed:', err?.message || err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────
// Public entry
// ──────────────────────────────────────────────────────────────────

/**
 * Refine a Python-ML prediction object using contextualAnswers.
 *
 * @param {Object} prediction  - the full raw Python response
 *                               (keeps all original fields intact)
 * @param {Object} opts
 * @param {Object} opts.contextualAnswers
 * @param {Object} opts.profile
 * @param {Array<string>} opts.symptoms - selected symptom keys
 *
 * @returns {{
 *   predictedDisease: string,
 *   confidence: number | null,
 *   topPredictions: Array,
 *   refinementApplied: boolean,
 *   refinementSource: 'none' | 'rules' | 'llm' | 'hybrid',
 *   refinementReasons: Array<string>
 * }}
 */
export async function refinePrediction(prediction, opts = {}) {
  const { contextualAnswers = {}, profile = {}, symptoms = [] } = opts;
  const originalTop = Array.isArray(prediction?.topPredictions) ? prediction.topPredictions : [];

  if (originalTop.length === 0) {
    return {
      predictedDisease: prediction?.predictedDisease || null,
      confidence: typeof prediction?.confidence === 'number' ? prediction.confidence : null,
      topPredictions: [],
      refinementApplied: false,
      refinementSource: 'none',
      refinementReasons: [],
    };
  }

  const { predictions: afterRules, hits: ruleHits } = applyRules(
    originalTop,
    contextualAnswers,
    profile
  );
  const rulesChanged = ruleHits.length > 0;

  let final = afterRules;
  let source = rulesChanged ? 'rules' : 'none';
  const reasons = ruleHits.flatMap((h) => h.reasons || []);

  // Tier B — only when rules did nothing AND the top two are close.
  const gap = (afterRules[0]?.confidence || 0) - (afterRules[1]?.confidence || 0);
  const isAmbiguous = afterRules.length >= 2 && gap < 0.08;

  if (!rulesChanged && isAmbiguous) {
    const llm = await rerankWithLlm(afterRules, contextualAnswers, profile, symptoms);
    if (llm && Array.isArray(llm.predictions) && llm.predictions.length > 0) {
      final = llm.predictions;
      source = 'llm';
      reasons.push(llm.cached ? 'LLM re-rank (cached)' : 'LLM re-rank');
    }
  } else if (rulesChanged && isAmbiguous) {
    // Unusual branch: rules fired but still ambiguous — try LLM as a
    // second pass and mark as hybrid if both contributed.
    const llm = await rerankWithLlm(afterRules, contextualAnswers, profile, symptoms);
    if (llm && Array.isArray(llm.predictions) && llm.predictions.length > 0) {
      final = llm.predictions;
      source = 'hybrid';
      reasons.push(llm.cached ? 'LLM re-rank (cached)' : 'LLM re-rank');
    }
  }

  const applied = source !== 'none';
  const newTop = final[0] || null;

  return {
    predictedDisease: newTop?.disease || prediction?.predictedDisease || null,
    confidence:
      typeof newTop?.confidence === 'number'
        ? newTop.confidence
        : typeof prediction?.confidence === 'number'
          ? prediction.confidence
          : null,
    topPredictions: final,
    refinementApplied: applied,
    refinementSource: source,
    refinementReasons: reasons,
  };
}

export { RULES };

// ──────────────────────────────────────────────────────────────────
// Emergency-override rules — last-resort safety net. Runs AFTER the
// clinical reviewer and ensures clinically dangerous symptom patterns
// always surface the corresponding emergency disease in the top-3,
// regardless of what the models (or the reviewer) said. Each rule pulls
// from the allowedDiseases.json catalog so descriptions and precautions
// are automatically populated.
//
// Safety-first design: we do NOT demote existing predictions — we only
// ENSURE the emergency option is present. If the emergency disease is
// already in the list, we bump its confidence to at least `minConfidence`.
// Otherwise we insert it at the top with `injectConfidence`.
// ──────────────────────────────────────────────────────────────────

const asStr = (v) => (v == null ? '' : String(v).trim().toLowerCase());

const EMERGENCY_RULES = [
  {
    id: 'thunderclap_headache',
    when: (ctx) =>
      asStr(ctx.headache_sudden) === 'yes' || asStr(ctx.headache_severity) === 'worst ever',
    diseases: ['Subarachnoid Hemorrhage', 'Bacterial Meningitis'],
    reason:
      'Sudden severe (\"thunderclap\") headache can signal bleeding in the brain — needs emergency evaluation.',
    injectConfidence: 0.55,
    minConfidence: 0.6,
  },
  {
    id: 'cardiac_chest_pain_radiates',
    when: (ctx, profile) => {
      const radiates = asStr(ctx.chest_pain_radiates) === 'yes';
      const pressure = asStr(ctx.chest_pain_character).includes('pressure');
      const exertional = asStr(ctx.chest_pain_trigger) === 'yes';
      const age = Number(profile?.age);
      return radiates && (pressure || exertional || (Number.isFinite(age) && age >= 45));
    },
    diseases: ['Myocardial Infarction (Heart Attack)', 'Angina Pectoris', 'Aortic Dissection'],
    reason:
      'Chest pain radiating to the arm or jaw is a classic warning for a cardiac event and warrants emergency evaluation.',
    injectConfidence: 0.6,
    minConfidence: 0.65,
  },
  {
    id: 'blood_in_vomit',
    when: (ctx) => asStr(ctx.vomiting_blood) === 'yes',
    diseases: ['Peptic Ulcer Disease'],
    reason:
      'Blood in vomit may indicate bleeding from the upper digestive tract and should be evaluated urgently.',
    injectConfidence: 0.55,
    minConfidence: 0.6,
  },
  {
    id: 'blood_in_stool',
    when: (ctx) => asStr(ctx.diarrhea_blood) === 'yes',
    diseases: ['Inflammatory Bowel Disease (IBD)', 'Diverticulitis'],
    reason:
      'Blood in stool can indicate active bleeding or significant inflammation and should be assessed promptly.',
    injectConfidence: 0.5,
    minConfidence: 0.55,
  },
  {
    id: 'severe_breathlessness',
    when: (ctx) => {
      const sev = asStr(ctx.breathlessness_severity);
      return sev === 'severe' || sev === 'cannot speak full sentences';
    },
    diseases: ['Pulmonary Embolism', 'Asthma', 'Pneumonia'],
    reason:
      'Severe breathlessness — especially if unable to speak full sentences — can indicate a serious lung or clot problem.',
    injectConfidence: 0.5,
    minConfidence: 0.6,
  },
  {
    id: 'severe_dizziness_with_fainting',
    when: (ctx) => asStr(ctx.dizziness_fainting) === 'yes',
    diseases: ['Ischemic Stroke', 'Transient Ischemic Attack (TIA)'],
    reason:
      'Dizziness with fainting, especially in older adults, may signal reduced blood flow to the brain.',
    injectConfidence: 0.45,
    minConfidence: 0.5,
  },
  {
    id: 'tb_signature',
    when: (ctx) => {
      const sweatNight = asStr(ctx.sweating_night) === 'yes';
      const amount = asStr(ctx.weight_loss_amount);
      const unintent = asStr(ctx.weight_loss_intentional) === 'no';
      const significant = amount === '5-10 kg' || amount === '>10 kg';
      return sweatNight && unintent && significant;
    },
    diseases: ['Tuberculosis'],
    reason:
      'Night sweats with unintentional weight loss is a classic pattern for tuberculosis and should be screened.',
    injectConfidence: 0.55,
    minConfidence: 0.6,
  },
];

function findPrediction(list, name) {
  const target = String(name).toLowerCase();
  return list.find((p) => String(p.disease || '').toLowerCase() === target);
}

/**
 * Apply emergency-override rules to a final prediction list. Mutates a
 * cloned copy — never the original. Returns `{ predictions, overrides }`
 * where `overrides` is an array of `{ rule, diseases, reason }` describing
 * the rules that fired. `predictions[i].catalogEntry` is populated for any
 * newly injected prediction so downstream hydration keeps working.
 */
export function applyEmergencyOverrides({ predictions, contextualAnswers = {}, profile = {} }) {
  const working = Array.isArray(predictions)
    ? predictions.map((p) => ({
        disease: p.disease,
        confidence: typeof p.confidence === 'number' ? p.confidence : 0,
        reasoning: p.reasoning || '',
        catalogEntry: p.catalogEntry || null,
      }))
    : [];
  const overrides = [];

  for (const rule of EMERGENCY_RULES) {
    let fired = false;
    try {
      if (!rule.when(contextualAnswers || {}, profile || {})) continue;
    } catch {
      continue;
    }

    for (const diseaseName of rule.diseases) {
      const existing = findPrediction(working, diseaseName);
      if (existing) {
        // Already predicted — bump confidence if below the floor.
        if (existing.confidence < rule.minConfidence) {
          existing.confidence = rule.minConfidence;
        }
        // Ensure the reasoning reflects the red-flag rule fired.
        if (!existing.reasoning || existing.reasoning.length < 20) {
          existing.reasoning = rule.reason;
        }
        fired = true;
      } else {
        // Inject as a new top candidate. Only if we have the catalog
        // entry to hydrate descriptions/precautions/etc.
        const entry = findCatalogEntry(diseaseName);
        if (!entry) continue;
        working.push({
          disease: entry.name,
          confidence: rule.injectConfidence,
          reasoning: rule.reason,
          catalogEntry: entry,
          injected: true,
        });
        fired = true;
      }
    }

    if (fired) {
      overrides.push({
        rule: rule.id,
        diseases: rule.diseases,
        reason: rule.reason,
      });
    }
  }

  working.sort((a, b) => b.confidence - a.confidence);
  return { predictions: working.slice(0, 3), overrides };
}

export { EMERGENCY_RULES };

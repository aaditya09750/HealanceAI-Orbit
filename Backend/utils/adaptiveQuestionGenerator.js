/**
 * Builds the final list of follow-up questions for a given set of selected
 * symptoms. Primary source is the static catalog in data/symptomFollowUps.js;
 * an optional Groq-powered supplement adds profile-aware questions for novel
 * or clinically-nuanced cases (e.g. diabetic + fever → ketone-awareness).
 *
 * Guarantees:
 *   - Deterministic ordering: primary sort by priority desc, tiebreak by id.
 *   - Dedup by question id (first-seen wins).
 *   - Cap at MAX_QUESTIONS; redFlag questions bypass the cap and stay.
 *   - LLM supplement is strictly additive — if it fails or is rate-limited
 *     for any reason, the response degrades to catalog-only and never
 *     surfaces an error to the caller.
 */

import { SYMPTOM_FOLLOWUPS, SHARED_QUESTIONS, CATALOG_VERSION } from '../data/symptomFollowUps.js';
import { generateAdaptiveQuestions as llmSupplement } from './groqClient.js';

const MAX_QUESTIONS = 6;

const VALID_TYPES = new Set(['chip', 'number', 'multiselect']);

// Profile is considered "interesting" (worth asking the LLM for a supplement)
// when the user has chronic conditions or active medications relevant to the
// picked symptoms. Kept deliberately conservative so we only hit Groq on
// cases the catalog cannot cover well.
function profileWarrantsSupplement(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const conditions = Array.isArray(profile.medicalConditions) ? profile.medicalConditions : [];
  const medications = Array.isArray(profile.medications) ? profile.medications : [];
  return conditions.length > 0 || medications.length > 0;
}

function normalizeCatalogQuestion(raw, symptomKey) {
  if (!raw || typeof raw !== 'object' || !raw.id || !raw.label) return null;
  if (!VALID_TYPES.has(raw.type)) return null;
  const base = {
    id: String(raw.id),
    symptom: symptomKey || raw.symptom || 'general',
    label: String(raw.label),
    type: raw.type,
    required: Boolean(raw.required),
    priority: Number.isFinite(raw.priority) ? raw.priority : 0,
  };
  if (raw.redFlag) base.redFlag = true;
  if (raw.helpText) base.helpText = String(raw.helpText);
  if (raw.unit) base.unit = String(raw.unit);
  if (Number.isFinite(raw.min)) base.min = raw.min;
  if (Number.isFinite(raw.max)) base.max = raw.max;
  if (Array.isArray(raw.options) && (raw.type === 'chip' || raw.type === 'multiselect')) {
    base.options = raw.options.map((o) => String(o)).filter(Boolean);
  }
  return base;
}

function gatherCatalogCandidates(symptoms) {
  const out = [];
  for (const symptom of symptoms) {
    const entries = SYMPTOM_FOLLOWUPS[symptom];
    if (!Array.isArray(entries)) continue;
    for (const raw of entries) {
      const q = normalizeCatalogQuestion(raw, symptom);
      if (q) out.push(q);
    }
  }
  // Shared questions always folded in once
  for (const raw of SHARED_QUESTIONS) {
    const q = normalizeCatalogQuestion(raw, 'general');
    if (q) out.push(q);
  }
  return out;
}

function dedupeByIdKeepFirst(list) {
  const seen = new Set();
  const out = [];
  for (const q of list) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

function orderQuestions(list) {
  return [...list].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Caps the list at MAX_QUESTIONS while always preserving every redFlag
 * question — clinical safety overrides the visual cap.
 */
function applyCap(ordered, cap = MAX_QUESTIONS) {
  const redFlags = ordered.filter((q) => q.redFlag);
  const nonFlags = ordered.filter((q) => !q.redFlag);
  const keepFromNonFlags = Math.max(0, cap - redFlags.length);
  const trimmed = nonFlags.slice(0, keepFromNonFlags);
  return orderQuestions([...redFlags, ...trimmed]);
}

/**
 * Main entrypoint. Returns `{ questions, source, version }`.
 *   source: 'catalog' | 'hybrid'  — 'hybrid' when LLM supplement added items.
 *   version: catalog version string (stable across requests unless the
 *            catalog file changes).
 */
export async function buildAdaptiveQuestions(symptoms, profile = null) {
  const uniqueSymptoms = Array.isArray(symptoms)
    ? [...new Set(symptoms.filter((s) => typeof s === 'string' && s))]
    : [];

  if (uniqueSymptoms.length === 0) {
    return { questions: [], source: 'catalog', version: CATALOG_VERSION };
  }

  const catalogCandidates = gatherCatalogCandidates(uniqueSymptoms);
  let source = 'catalog';

  // Optional LLM supplement — only attempted when profile signals it's
  // worth the token budget. Catches every error silently.
  if (profileWarrantsSupplement(profile)) {
    try {
      const supplement = await llmSupplement(uniqueSymptoms, profile);
      if (Array.isArray(supplement) && supplement.length > 0) {
        for (const raw of supplement) {
          const q = normalizeCatalogQuestion(raw, raw.symptom || 'personalized');
          if (q) catalogCandidates.push(q);
        }
        source = 'hybrid';
      }
    } catch (err) {
      // Swallow — hybrid supplement is best-effort.
      console.warn('[adaptiveQuestionGenerator] LLM supplement failed:', err?.message || err);
    }
  }

  const deduped = dedupeByIdKeepFirst(catalogCandidates);
  const ordered = orderQuestions(deduped);
  const capped = applyCap(ordered, MAX_QUESTIONS);

  return { questions: capped, source, version: CATALOG_VERSION };
}

export { CATALOG_VERSION };

/**
 * LLM clinical reviewer.
 *
 * Merges the ML candidate list and the LLM primary-predictor list into a
 * final top-3 with per-disease reasoning. Returns graceful fallbacks when
 * Groq is unavailable so the pipeline never blocks on LLM failure.
 *
 * Contract:
 *   Input  — { mlCandidates, llmCandidates, symptoms, contextualAnswers,
 *              profile }
 *   Output — { predictions: [{ disease, confidence, reasoning,
 *              catalogEntry }], source: 'ensemble' | 'llm' | 'ml' }
 */

import { reviewCandidates } from './groqClient.js';
import { findCatalogEntry, getCatalog } from './llmDiseasePredictor.js';

const MAX_FINAL = 3;

function clampConfidence(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function dedupeKeepFirst(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = String(item.disease || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Deterministic fallback when Groq is unavailable — simply merge ML + LLM
 * candidates by confidence. Used on the `ml` or `llm` branches when the
 * reviewer itself couldn't run.
 */
function mergeDeterministic(mlCandidates = [], llmCandidates = []) {
  // Preserve LLM reasoning where available; ML predictions have no reasoning
  // so generate a simple fallback sentence from the disease name.
  const merged = [
    ...llmCandidates.map((c) => ({
      disease: String(c.disease || '').trim(),
      confidence: clampConfidence(c.confidence),
      reasoning:
        c.reasoning && c.reasoning.trim()
          ? c.reasoning.trim()
          : 'Pattern of symptoms is consistent with this condition.',
    })),
    ...mlCandidates.map((c) => ({
      disease: String(c.disease || '').trim(),
      confidence: clampConfidence(c.confidence),
      reasoning: 'Machine-learning pattern match against typical symptom profile.',
    })),
  ].filter((c) => c.disease);

  const deduped = dedupeKeepFirst(merged);
  deduped.sort((a, b) => b.confidence - a.confidence);
  return deduped.slice(0, MAX_FINAL);
}

export async function reviewPredictions({
  mlCandidates = [],
  llmCandidates = [],
  symptoms = [],
  contextualAnswers = {},
  profile = {},
}) {
  const catalog = getCatalog();
  const haveCatalog = Array.isArray(catalog.diseases) && catalog.diseases.length > 0;
  const hasLlm = Array.isArray(llmCandidates) && llmCandidates.length > 0;
  const hasMl = Array.isArray(mlCandidates) && mlCandidates.length > 0;

  // Both sources empty — caller handles empty-prediction path.
  if (!hasLlm && !hasMl) {
    return { predictions: [], source: 'none' };
  }

  // No catalog means we can't validate names or hydrate details — fall back
  // to deterministic merge without attempting a reviewer call.
  if (!haveCatalog) {
    const merged = mergeDeterministic(mlCandidates, llmCandidates);
    return {
      predictions: merged.map((m) => ({ ...m, catalogEntry: null })),
      source: hasMl && hasLlm ? 'ensemble' : hasLlm ? 'llm' : 'ml',
    };
  }

  // Only one source, no need to spend an LLM call on review — just pass
  // through with catalog hydration for the one source we have.
  if (!hasMl || !hasLlm) {
    const src = hasLlm ? 'llm' : 'ml';
    const list = hasLlm ? llmCandidates : mlCandidates;
    const hydrated = list
      .map((c) => {
        const entry = findCatalogEntry(c.disease);
        return entry
          ? {
              disease: entry.name,
              confidence: clampConfidence(c.confidence),
              reasoning:
                c.reasoning && c.reasoning.trim()
                  ? c.reasoning.trim()
                  : src === 'llm'
                    ? 'Pattern of symptoms is consistent with this condition.'
                    : 'Machine-learning pattern match against typical symptom profile.',
              catalogEntry: entry,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_FINAL);
    return { predictions: hydrated, source: src };
  }

  // Both sources available — run the reviewer. On failure, fall back to
  // deterministic merge and still tag as ensemble.
  const reviewed = await reviewCandidates({
    mlCandidates,
    llmCandidates,
    symptoms,
    contextualAnswers,
    profile,
    allowedDiseases: catalog.diseases,
  });

  if (Array.isArray(reviewed) && reviewed.length > 0) {
    const hydrated = reviewed
      .map((r) => {
        const entry = findCatalogEntry(r.disease);
        return entry
          ? {
              disease: entry.name,
              confidence: clampConfidence(r.confidence),
              reasoning:
                r.reasoning && r.reasoning.trim()
                  ? r.reasoning.trim()
                  : 'Combined reasoning from symptom pattern and contextual answers.',
              catalogEntry: entry,
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, MAX_FINAL);
    if (hydrated.length > 0) {
      return { predictions: hydrated, source: 'ensemble' };
    }
  }

  // Reviewer failed (or filtered out all names) — deterministic merge.
  const merged = mergeDeterministic(mlCandidates, llmCandidates)
    .map((m) => {
      const entry = findCatalogEntry(m.disease);
      return entry ? { ...m, disease: entry.name, catalogEntry: entry } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_FINAL);

  return { predictions: merged, source: 'ensemble' };
}

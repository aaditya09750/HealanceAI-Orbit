/**
 * LLM primary disease predictor.
 *
 * Thin wrapper over groqClient.predictWithAllowedDiseases that:
 *  1. Loads the 150-disease allowed catalog (once, cached).
 *  2. Resolves each predicted disease name back to the full catalog entry
 *     so the controller can persist description/medications/diet/etc
 *     alongside the prediction — just like the Python ML path does.
 *  3. Degrades gracefully to an empty list when Groq is unavailable.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { predictWithAllowedDiseases } from './groqClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '../data/allowedDiseases.json');

let catalogCache = null;
let catalogCacheLoadedAt = 0;
const CATALOG_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

function loadCatalog() {
  const now = Date.now();
  if (catalogCache && now - catalogCacheLoadedAt < CATALOG_CACHE_TTL_MS) {
    return catalogCache;
  }
  try {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.diseases)) {
      catalogCache = { version: '0.0.0', diseases: [] };
    } else {
      catalogCache = parsed;
    }
    catalogCacheLoadedAt = now;
  } catch (err) {
    console.error('[llmDiseasePredictor] failed to load catalog:', err.message);
    catalogCache = { version: '0.0.0', diseases: [] };
  }
  return catalogCache;
}

/**
 * Convert a catalog entry into the legacy `details` shape the frontend
 * already renders (description, precautions, medications, diets, workouts,
 * riskFactors). Keeps the shared Top Predictions + four cards UI working.
 */
export function catalogEntryToDetails(entry) {
  if (!entry) return {};
  return {
    description: entry.description || '',
    precautions: Array.isArray(entry.precautions) ? entry.precautions : [],
    medications: Array.isArray(entry.medications) ? entry.medications : [],
    diets: Array.isArray(entry.diets) ? entry.diets : [],
    workouts: Array.isArray(entry.workouts) ? entry.workouts : [],
    riskFactors: Array.isArray(entry.redFlagHints) ? entry.redFlagHints : [],
  };
}

export function getCatalog() {
  return loadCatalog();
}

export function findCatalogEntry(name) {
  const catalog = loadCatalog();
  if (!name) return null;
  const target = String(name).trim().toLowerCase();
  return (
    catalog.diseases.find((d) => d.name.toLowerCase() === target) ||
    catalog.diseases.find((d) =>
      (d.aliases || []).some((a) => String(a).toLowerCase() === target)
    ) ||
    null
  );
}

/**
 * Run the LLM predictor and return a list of `{disease, confidence,
 * reasoning, catalogEntry}` objects. catalogEntry is the full entry from
 * allowedDiseases.json so downstream code can hydrate details without
 * re-reading the file. Empty array on any failure.
 */
export async function predictDiseaseWithLLM({ symptoms, contextualAnswers, profile }) {
  const catalog = loadCatalog();
  if (!Array.isArray(catalog.diseases) || catalog.diseases.length === 0) return [];

  const predictions = await predictWithAllowedDiseases({
    symptoms,
    contextualAnswers,
    profile,
    allowedDiseases: catalog.diseases,
  });
  if (!Array.isArray(predictions) || predictions.length === 0) return [];

  return predictions
    .map((p) => ({
      disease: p.disease,
      confidence: p.confidence,
      reasoning: p.reasoning || '',
      catalogEntry: findCatalogEntry(p.disease),
    }))
    .filter((p) => p.catalogEntry);
}

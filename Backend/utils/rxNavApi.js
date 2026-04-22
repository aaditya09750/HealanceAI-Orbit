/**
 * RxNav (NIH) integration — free, no API key required.
 *
 * Used to:
 *   1. Normalize a raw drug name → RxCUI (standardized drug identifier)
 *   2. Fetch drug class information (e.g., "statin", "ACE inhibitor")
 *
 * NOTE: The NLM discontinued the RxNav drug-drug interaction (DDI)
 * endpoints in January 2024. For interaction detection we fall back to
 * keyword-matching the user's current medications against the openFDA
 * drug label's "drug_interactions" field — handled in chatbotController.
 *
 * Docs: https://rxnav.nlm.nih.gov/RxNormAPIs.html
 */

const BASE = 'https://rxnav.nlm.nih.gov/REST';
const TIMEOUT_MS = 6000;

// Simple in-memory cache — RxNav data rarely changes
const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[rxnav] fetch failed:', url, err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalize a drug name into a canonical RxCUI.
 * Returns { rxcui, name, score } or null if not found.
 */
export async function normalizeDrug(drugName) {
  if (!drugName || typeof drugName !== 'string') return null;
  const trimmed = drugName.trim();
  if (!trimmed) return null;

  const cacheKey = `normalize:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  const url = `${BASE}/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=1`;
  const data = await fetchJson(url);
  const candidate = data?.approximateGroup?.candidate?.[0];
  if (!candidate || !candidate.rxcui) {
    cacheSet(cacheKey, null);
    return null;
  }
  const result = {
    rxcui: candidate.rxcui,
    name: candidate.name || trimmed,
    score: Number(candidate.score) || null,
  };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Get the therapeutic drug class(es) for an RxCUI.
 * Returns an array of { className, classType, source } or [].
 */
export async function getDrugClass(rxcui) {
  if (!rxcui) return [];

  const cacheKey = `class:${rxcui}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  // ATC classification is the most useful general-purpose one
  const url = `${BASE}/rxclass/class/byRxcui.json?rxcui=${encodeURIComponent(rxcui)}&relaSource=ATC`;
  const data = await fetchJson(url);
  const items = data?.rxclassDrugInfoList?.rxclassDrugInfo || [];
  const classes = items
    .map((i) => ({
      className: i.rxclassMinConceptItem?.className || null,
      classType: i.rxclassMinConceptItem?.classType || null,
      source: 'ATC',
    }))
    .filter((c) => c.className);

  // Dedupe by className
  const seen = new Set();
  const unique = classes.filter((c) => {
    if (seen.has(c.className)) return false;
    seen.add(c.className);
    return true;
  });

  cacheSet(cacheKey, unique);
  return unique;
}

/**
 * Detect likely drug-drug interactions by keyword-matching the user's
 * current medications against the provided drug's label text (from
 * openFDA's drug_interactions field). This is a simple heuristic and
 * not a substitute for a real DDI database — every card shows a
 * prominent "consult a pharmacist" disclaimer.
 *
 * @param labelText string  — the drug_interactions / contraindications text from openFDA
 * @param userMeds  string[] — names of current medications the user is on
 * @returns Array of { drug, evidence } matches
 */
export function matchInteractionsInLabel(labelText, userMeds = []) {
  if (!labelText || typeof labelText !== 'string') return [];
  if (!Array.isArray(userMeds) || userMeds.length === 0) return [];
  const lower = labelText.toLowerCase();
  const matches = [];
  for (const med of userMeds) {
    const clean = String(med || '').trim();
    if (!clean || clean.length < 3) continue;
    const lowerMed = clean.toLowerCase();
    const idx = lower.indexOf(lowerMed);
    if (idx === -1) continue;
    // Grab a short surrounding snippet as evidence
    const start = Math.max(0, idx - 80);
    const end = Math.min(labelText.length, idx + lowerMed.length + 80);
    let snippet = labelText.slice(start, end).trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < labelText.length) snippet = snippet + '…';
    matches.push({ drug: clean, evidence: snippet });
  }
  return matches;
}

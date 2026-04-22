/**
 * FDA drug label text is deliberately verbose and full of cross-reference
 * markers that are meaningless outside the original document. This util
 * normalises the text for display in the chat UI.
 *
 * Transforms applied (all deterministic, no LLM):
 *   1. Strip "[see Warnings and Precautions (5.1)]" style cross-references
 *   2. Strip standalone section numbers like "( 5.1 )" or "( 4 )"
 *   3. Strip leading section headers like "1 INDICATIONS AND USAGE"
 *   4. Strip inline upper-case section names that repeat mid-paragraph
 *   5. Dedupe identical sentences (FDA labels often restate the same fact)
 *   6. Collapse repeated whitespace / newlines
 *   7. Trim excessive length by picking the first ~800 chars' worth of
 *      distinct sentences — callers can still request the full text.
 */

// Common FDA label section headers we want to strip when they appear as
// bare prefixes. Matched case-insensitively, whole-word.
const SECTION_HEADERS = [
  'INDICATIONS AND USAGE',
  'DOSAGE AND ADMINISTRATION',
  'DOSAGE FORMS AND STRENGTHS',
  'CONTRAINDICATIONS',
  'WARNINGS AND PRECAUTIONS',
  'WARNINGS',
  'ADVERSE REACTIONS',
  'DRUG INTERACTIONS',
  'USE IN SPECIFIC POPULATIONS',
  'OVERDOSAGE',
  'CLINICAL PHARMACOLOGY',
  'HOW SUPPLIED',
  'PATIENT COUNSELING INFORMATION',
];

const stripSectionRefs = (text) => {
  if (!text) return text;
  let out = text;

  // "[see Warnings and Precautions ( 5.1 )]" / "[See 12.3]" / "[see adverse reactions]"
  out = out.replace(/\[\s*see\s+[^\]]+\]/gi, '');

  // Bare parenthetical section numbers: "( 5.1 )", "(2.1)", "(4)"
  out = out.replace(/\(\s*\d+\.?\d*\s*\)/g, '');

  // Leading section-number prefix on first run of text: "1 INDICATIONS AND USAGE ZITUVIMET is..."
  // Only strip the header prefix, preserve the following sentence.
  out = out.replace(new RegExp(`^\\s*\\d+\\.?\\d*\\s+(${SECTION_HEADERS.join('|')})\\s+`, 'i'), '');
  // Inline headers mid-stream like "2 DOSAGE AND ADMINISTRATION Take..." → strip the tag
  out = out.replace(
    new RegExp(`(?:^|\\s)(\\d+\\.?\\d*\\s+)?(${SECTION_HEADERS.join('|')})\\s+`, 'gi'),
    ' '
  );

  // Tiny leftovers like trailing " . " or " , " after stripping parens
  out = out.replace(/\s+([.,;:!?])/g, '$1');

  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
};

const dedupeSentences = (text) => {
  if (!text) return text;
  // Split on sentence boundaries but keep punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seen = new Set();
  const out = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    // Normalize for dedup key: lowercase + strip punctuation
    const key = s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    // Short sentences (e.g. section fragments) aren't deduped
    if (key.length < 18) {
      out.push(s);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.join(' ');
};

/**
 * Main cleaner — call this on every FDA label field before sending to UI.
 * Returns the cleaned string, or empty string if input was falsy/noise.
 */
export function cleanFdaText(text) {
  if (!text || typeof text !== 'string') return '';
  // Common FDA fallback phrases from our own fdaApi parser — drop them
  const noise = new Set([
    'Information not available',
    'Consult your doctor for proper dosage',
    'See package insert for warnings',
    'Consult healthcare provider',
    'See package insert for adverse reactions',
    'Consult your doctor about drug interactions',
    'See package insert',
    'Store as directed on package',
  ]);
  if (noise.has(text.trim())) return '';

  const stripped = stripSectionRefs(text);
  const deduped = dedupeSentences(stripped);

  // Hard cap on length so we don't render 5000-char walls of text.
  // We still pass the cleaned text through and let the UI "Show more"
  // toggle handle preview truncation — the hard cap is a safety net
  // for truly enormous label fields.
  const HARD_CAP = 1800;
  if (deduped.length <= HARD_CAP) return deduped;

  // Truncate at the nearest sentence boundary ≤ HARD_CAP
  const cutIdx = deduped.lastIndexOf('. ', HARD_CAP);
  if (cutIdx > 600) return deduped.slice(0, cutIdx + 1).trim();
  return deduped.slice(0, HARD_CAP).trim() + '…';
}

/**
 * Shortcut — clean every property in a {field: text} map. Keys with
 * empty strings after cleaning are dropped so the UI doesn't render
 * empty sections.
 */
export function cleanFdaFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const cleaned = cleanFdaText(v);
      if (cleaned) out[k] = cleaned;
    } else {
      out[k] = v;
    }
  }
  return out;
}

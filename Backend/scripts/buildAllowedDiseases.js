/**
 * buildAllowedDiseases.js
 *
 * Validates (and can regenerate gap-fill content for) the canonical
 * 150-disease catalog at Backend/data/allowedDiseases.json.
 *
 * The catalog was hand-curated from public MedlinePlus / CDC / NIH
 * material for v1. This script exists so the team can:
 *   1. Validate the catalog structure (default action — safe to run).
 *   2. Gap-fill any disease whose precautions / medications / diets /
 *      workouts arrays are empty, using Groq (requires GROQ_API_KEY).
 *   3. Add new diseases programmatically by appending to a seed list
 *      and re-running.
 *
 * Usage:
 *   node Backend/scripts/buildAllowedDiseases.js            # validate only
 *   node Backend/scripts/buildAllowedDiseases.js --gap-fill # fill blanks via Groq
 *
 * The script never overwrites non-empty fields; it only fills gaps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '../data/allowedDiseases.json');

const REQUIRED_TOP_LEVEL = ['version', 'diseases'];
const REQUIRED_DISEASE_FIELDS = [
  'name',
  'icd10',
  'description',
  'precautions',
  'medications',
  'diets',
  'workouts',
  'redFlagHints',
];
const ARRAY_FIELDS = ['precautions', 'medications', 'diets', 'workouts', 'redFlagHints', 'aliases'];

function loadCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Catalog not found at ${CATALOG_PATH}`);
  }
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveCatalog(data) {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function validateCatalog(catalog) {
  const issues = [];
  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in catalog)) issues.push(`Missing top-level key: ${key}`);
  }
  if (!Array.isArray(catalog.diseases)) {
    issues.push('diseases is not an array');
    return issues;
  }

  const seenNames = new Set();
  catalog.diseases.forEach((d, idx) => {
    const where = `diseases[${idx}] (${d?.name || 'unnamed'})`;
    for (const field of REQUIRED_DISEASE_FIELDS) {
      if (!(field in d)) issues.push(`${where}: missing field "${field}"`);
    }
    for (const field of ARRAY_FIELDS) {
      if (field in d && !Array.isArray(d[field])) {
        issues.push(`${where}: field "${field}" must be an array`);
      }
    }
    if (d?.name) {
      const key = String(d.name).toLowerCase();
      if (seenNames.has(key)) issues.push(`${where}: duplicate disease name`);
      seenNames.add(key);
    }
    if (typeof d?.description !== 'string' || !d.description.trim()) {
      issues.push(`${where}: description must be a non-empty string`);
    }
  });

  return issues;
}

function findGapDiseases(catalog) {
  return catalog.diseases.filter((d) => {
    const emptyList = (k) => !Array.isArray(d[k]) || d[k].length === 0;
    return (
      emptyList('precautions') ||
      emptyList('medications') ||
      emptyList('diets') ||
      emptyList('workouts')
    );
  });
}

async function gapFillViaGroq(catalog) {
  // Dynamic import so the validator path works even when GROQ_API_KEY is
  // absent and the SDK modules fail to initialise.
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing. Set it in Backend/.env before running --gap-fill.');
    process.exit(2);
  }
  const client = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });

  const gaps = findGapDiseases(catalog);
  if (gaps.length === 0) {
    console.log('No gaps found — nothing to fill.');
    return catalog;
  }
  console.log(`Filling gaps for ${gaps.length} disease(s)…`);

  const systemPrompt = `You are a patient-education content writer.

For the disease name and short description the user provides, return a JSON object with the fields precautions, medications, diets, workouts. Each is an array of 3-5 short, patient-friendly sentences based on widely-accepted public health guidance (MedlinePlus, CDC, NIH).

Rules:
- medications: generic names or drug classes only (e.g. "Acetaminophen", "ACE inhibitors"). Never prescribe dose.
- Avoid empty strings. Avoid diagnosing or recommending tests.
- Return ONLY the JSON object, no prose, no markdown fences.

SCHEMA:
{
  "precautions": [string],
  "medications": [string],
  "diets": [string],
  "workouts": [string]
}`;

  for (const disease of gaps) {
    const userPrompt = `Disease: ${disease.name}\nDescription: ${disease.description}\nReturn the JSON object only.`;
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
      const raw = completion?.choices?.[0]?.message?.content;
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      for (const field of ['precautions', 'medications', 'diets', 'workouts']) {
        if (
          (!Array.isArray(disease[field]) || disease[field].length === 0) &&
          Array.isArray(parsed[field])
        ) {
          disease[field] = parsed[field].map(String).filter(Boolean).slice(0, 5);
        }
      }
      console.log(`  filled: ${disease.name}`);
    } catch (err) {
      console.warn(`  skipped ${disease.name}: ${err?.message || err}`);
    }
  }
  return catalog;
}

async function main() {
  const args = process.argv.slice(2);
  const gapFill = args.includes('--gap-fill');

  const catalog = loadCatalog();
  const issues = validateCatalog(catalog);

  console.log(`Catalog version: ${catalog.version}`);
  console.log(`Total diseases : ${catalog.diseases.length}`);
  const emergencies = catalog.diseases.filter((d) => d.emergency);
  console.log(`Emergency flags: ${emergencies.length}`);

  if (issues.length) {
    console.error(`\n${issues.length} validation issue(s):`);
    issues.slice(0, 20).forEach((msg) => console.error(`  - ${msg}`));
    if (issues.length > 20) console.error(`  …and ${issues.length - 20} more`);
    process.exitCode = 1;
  } else {
    console.log('Validation: OK');
  }

  const gaps = findGapDiseases(catalog);
  if (gaps.length > 0) {
    console.log(`\n${gaps.length} disease(s) have empty required arrays:`);
    gaps.slice(0, 10).forEach((d) => console.log(`  - ${d.name}`));
  }

  if (gapFill) {
    const updated = await gapFillViaGroq(catalog);
    saveCatalog(updated);
    console.log(`\nWrote updated catalog to ${CATALOG_PATH}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err?.message || err);
  process.exit(3);
});

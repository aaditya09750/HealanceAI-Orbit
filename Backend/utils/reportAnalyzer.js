/**
 * Orchestrates report analysis: fetch MedicalReport -> extract text
 * -> Gemini structured analysis -> persist to MedicalReport.extractedData
 *
 * Returns a structured payload to the caller (controller). Every failure
 * mode returns a structured object with `status` so the UI can show
 * a graceful fallback card.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import MedicalReport from '../models/MedicalReport.js';
import { extractText } from './textExtractor.js';
// Primary: Groq (Llama 3.3, free tier, OpenAI-compatible).
// Gemini is kept as optional fallback but not wired in by default — swap
// here if needed.
import { analyzeReport as llmAnalyze, isGroqAvailable as isLLMAvailable } from './groqClient.js';

// Resolve the backend root once — this module lives at Backend/utils/, so
// `..` gives us Backend/. This matches how uploadMiddleware.js computes it.
const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.join(path.dirname(__filename), '..');

// The uploads directory (honours UPLOAD_PATH env var if set)
const uploadsDir = (() => {
  const configured = process.env.UPLOAD_PATH?.trim();
  if (!configured) return path.join(backendRoot, 'uploads');
  return path.isAbsolute(configured) ? configured : path.join(backendRoot, configured);
})();

const DISCLAIMER =
  'AI-generated analysis for educational purposes only. This is not a medical diagnosis. Please consult a qualified healthcare professional before making any medical decisions.';

/**
 * Analyze a report by its MongoDB _id (scoped to a user).
 * @returns {Promise<object>} { status, analysis?, reason?, disclaimer }
 *   status values:
 *     - 'ok'         → analysis ready
 *     - 'unsupported' → image file, no OCR in v1
 *     - 'empty'      → extracted text was too short
 *     - 'ai-unavailable' → no GEMINI_API_KEY or ai error
 *     - 'rate-limited' → free tier quota hit
 *     - 'not-found'  → report not owned by user
 *     - 'error'      → unexpected failure
 */
export async function analyzeReportById(reportId, userId) {
  if (!reportId || !userId) {
    return { status: 'not-found', disclaimer: DISCLAIMER };
  }

  let report;
  try {
    report = await MedicalReport.findOne({ _id: reportId, user: userId });
  } catch (err) {
    return { status: 'not-found', disclaimer: DISCLAIMER };
  }
  if (!report) {
    return { status: 'not-found', disclaimer: DISCLAIMER };
  }

  // If we've already analyzed this report, return the cached result.
  const cachedSummary = report.extractedData?.summary;
  const cachedFindings = report.extractedData?.keyFindings;
  if (cachedSummary && Array.isArray(cachedFindings) && cachedFindings.length > 0) {
    return {
      status: 'ok',
      cached: true,
      analysis: buildAnalysisFromModel(report),
      disclaimer: DISCLAIMER,
      reportId: report._id,
      fileName: report.title || report.file?.filename,
    };
  }

  // Resolve the file on disk
  const filePath = resolveReportFilePath(report);
  if (!filePath) {
    return { status: 'error', reason: 'file-path-missing', disclaimer: DISCLAIMER };
  }

  // Extract text
  const extraction = await extractText(filePath, report.file?.mimetype);
  if (!extraction.ok) {
    if (extraction.reason === 'image-unsupported') {
      return {
        status: 'unsupported',
        reason: 'image-ocr-not-available',
        message:
          'Image OCR is not yet supported. For best analysis please upload PDF or DOCX reports. You can still ask me questions about this image.',
        disclaimer: DISCLAIMER,
      };
    }
    if (extraction.reason === 'unsupported-type') {
      return {
        status: 'unsupported',
        reason: 'file-type-not-supported',
        message:
          'This file format is not supported for AI analysis yet. Please upload PDF or DOCX.',
        disclaimer: DISCLAIMER,
      };
    }
    if (extraction.reason === 'empty-text') {
      return {
        status: 'empty',
        message:
          'I uploaded your report, but I could not extract readable text from it. You can still ask me questions about it.',
        disclaimer: DISCLAIMER,
      };
    }
    if (extraction.reason === 'pdf-password-protected') {
      return {
        status: 'unsupported',
        reason: 'pdf-password-protected',
        message:
          'This PDF appears password-protected or encrypted. Please upload an unlocked copy for analysis.',
        disclaimer: DISCLAIMER,
      };
    }
    if (extraction.reason === 'corrupted-file') {
      return {
        status: 'unsupported',
        reason: 'corrupted-file',
        message:
          'This file appears corrupted or unreadable. Please re-export the report as PDF/DOCX and upload again.',
        disclaimer: DISCLAIMER,
      };
    }
    if (extraction.reason === 'pdf-runtime-error') {
      return {
        status: 'error',
        reason: 'pdf-runtime-error',
        message: 'PDF extraction service is temporarily unavailable. Please try again in a moment.',
        disclaimer: DISCLAIMER,
      };
    }
    return {
      status: 'error',
      reason: extraction.reason,
      message: 'I could not read this file. It may be corrupted or password-protected.',
      disclaimer: DISCLAIMER,
    };
  }

  // Call LLM (Groq primary)
  if (!isLLMAvailable()) {
    return {
      status: 'ai-unavailable',
      reason: 'no-api-key',
      message:
        'I uploaded your report successfully, but the AI analyzer is not configured right now. You can still ask me questions about it.',
      disclaimer: DISCLAIMER,
    };
  }

  const aiResult = await llmAnalyze(extraction.text);

  if (aiResult?.__rateLimited) {
    return {
      status: 'rate-limited',
      reason: aiResult.__rateLimited,
      message:
        'The daily AI analysis limit has been reached. Please try again later — your report is safely stored.',
      disclaimer: DISCLAIMER,
    };
  }

  if (!aiResult) {
    return {
      status: 'ai-unavailable',
      reason: 'analysis-failed',
      message:
        'I uploaded your report but could not generate an automated summary right now. You can still ask me questions about it.',
      disclaimer: DISCLAIMER,
    };
  }

  // Persist to MedicalReport.extractedData
  try {
    report.extractedData = {
      summary: aiResult.summary || '',
      keyFindings: (aiResult.keyFindings || []).map((f) => ({
        parameter: f.metric,
        value: f.value,
        normalRange: f.normalRange || '',
        status: f.status || 'normal',
      })),
      abnormalValues: (aiResult.keyFindings || [])
        .filter((f) => f.status && f.status !== 'normal')
        .map((f) => ({
          parameter: f.metric,
          value: f.value,
          normalRange: f.normalRange || '',
          status: f.status,
        })),
    };
    // Store the richer analysis on a virtual field (we also return it inline)
    await report.save();
  } catch (err) {
    // Persistence error shouldn't block returning the analysis
    console.error('[reportAnalyzer] save failed:', err.message);
  }

  return {
    status: 'ok',
    cached: false,
    analysis: {
      reportType: aiResult.reportType || 'Medical Report',
      summary: aiResult.summary || '',
      keyFindings: aiResult.keyFindings || [],
      flags: aiResult.flags || [],
      recommendedActions: aiResult.recommendedActions || [],
      suggestedMedications: aiResult.suggestedMedications || [],
      suggestedSpecialists: aiResult.suggestedSpecialists || [],
    },
    disclaimer: DISCLAIMER,
    reportId: report._id,
    fileName: report.title || report.file?.filename,
  };
}

function resolveReportFilePath(report) {
  const stored = report.file?.path;
  const filename = report.file?.filename;

  const candidates = [];

  // Try the filename directly inside the uploads dir (most reliable)
  if (filename) {
    candidates.push(path.join(uploadsDir, filename));
  }

  if (stored) {
    // Absolute path stored? try as-is
    if (path.isAbsolute(stored)) candidates.push(stored);

    // Stored as `/uploads/xxx.pdf` or `uploads/xxx.pdf` — map to backend root
    const cleaned = stored.replace(/^[\\/]+/, '');
    candidates.push(path.join(backendRoot, cleaned));

    // Fallback: just the basename dropped into uploadsDir
    candidates.push(path.join(uploadsDir, path.basename(stored)));
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }

  // Log what we tried to aid debugging
  console.error('[reportAnalyzer] file not found. Tried paths:', candidates);
  return null;
}

function buildAnalysisFromModel(report) {
  const findings = (report.extractedData?.keyFindings || []).map((f) => ({
    metric: f.parameter,
    value: f.value,
    normalRange: f.normalRange,
    status: f.status,
  }));
  return {
    reportType: report.type || 'Medical Report',
    summary: report.extractedData?.summary || '',
    keyFindings: findings,
    flags: [],
    recommendedActions: [],
    suggestedMedications: [],
    suggestedSpecialists: [],
  };
}

export { DISCLAIMER };

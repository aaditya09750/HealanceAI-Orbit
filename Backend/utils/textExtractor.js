/**
 * Text extraction from uploaded report files (PDF + DOCX for v1).
 * Image OCR (Tesseract) is deliberately skipped for v1 to keep the
 * backend lean — image uploads return a friendly "not supported" signal.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Dynamic-import inside the function so test suites that don't touch
// extraction don't have to resolve pdf-parse (it eagerly reads a sample
// file on import and throws in some CI environments).
//
// `filePath` may be:
//   - a Cloudinary HTTPS URL (current upload path)
//   - a local absolute or relative path (legacy uploads pre-Cloudinary)
async function readBufferFromSource(source) {
  if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Remote fetch ${res.status}: ${source}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  const absolutePath = path.resolve(source);
  if (!fs.existsSync(absolutePath)) {
    const err = new Error('file-missing');
    err.code = 'FILE_MISSING';
    throw err;
  }
  return fs.readFileSync(absolutePath);
}

export async function extractText(filePath, mimetype = '') {
  if (!filePath) {
    return { ok: false, reason: 'no-file', text: '' };
  }

  const isRemote = /^https?:\/\//i.test(filePath);
  const ext = path.extname(isRemote ? new URL(filePath).pathname : filePath).toLowerCase();
  const mime = (mimetype || '').toLowerCase();
  const isPdf = mime.includes('pdf') || ext === '.pdf';
  const isDocx = mime.includes('officedocument.wordprocessingml') || ext === '.docx';
  const isLegacyDoc = mime.includes('msword') || ext === '.doc';
  const isImage =
    mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);

  if (isImage) {
    return {
      ok: false,
      reason: 'image-unsupported',
      text: '',
    };
  }

  if (isLegacyDoc) {
    return {
      ok: false,
      reason: 'unsupported-type',
      text: '',
    };
  }

  try {
    const dataBuffer = await readBufferFromSource(filePath);

    if (isPdf) {
      // Use CJS require from ESM so pdf-parse initializes in normal module mode.
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(dataBuffer);
      const text = (result?.text || '').trim();
      if (text.length < 20) {
        return { ok: false, reason: 'empty-text', text: '' };
      }
      return { ok: true, text, pageCount: result?.numpages ?? result?.pages?.length };
    }

    if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      const text = (result.value || '').trim();
      if (text.length < 20) {
        return { ok: false, reason: 'empty-text', text: '' };
      }
      return { ok: true, text };
    }

    return { ok: false, reason: 'unsupported-type', text: '' };
  } catch (err) {
    if (err?.code === 'FILE_MISSING') {
      return { ok: false, reason: 'file-missing', text: '' };
    }
    const message = String(err?.message || '').toLowerCase();
    let reason = 'extraction-error';

    if (message.includes('password') || message.includes('encrypted')) {
      reason = 'pdf-password-protected';
    } else if (
      message.includes('invalid pdf') ||
      message.includes('malformed') ||
      message.includes('unexpected eof')
    ) {
      reason = 'corrupted-file';
    } else if (
      message.includes('dommatrix') ||
      message.includes('canvas') ||
      message.includes('pdfjs')
    ) {
      reason = 'pdf-runtime-error';
    }

    console.error('[textExtractor] extraction failed:', err.message);
    if (err.stack) console.error(err.stack);
    return { ok: false, reason, text: '', error: err.message };
  }
}

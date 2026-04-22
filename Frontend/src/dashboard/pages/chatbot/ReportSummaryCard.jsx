import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pill,
  Stethoscope,
  Info,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

// Colour + label per finding status
const statusMap = {
  normal: { color: 'text-[#10b981]', bg: 'bg-[#d1fae5]', label: 'Normal' },
  low: { color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]', label: 'Low' },
  high: { color: 'text-[#f97316]', bg: 'bg-[#ffedd5]', label: 'High' },
  critical: { color: 'text-[#ef4444]', bg: 'bg-[#fee2e2]', label: 'Critical' },
};

const severityMap = {
  low: { color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
  moderate: { color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]' },
  high: { color: 'text-[#ef4444]', bg: 'bg-[#fee2e2]' },
};

const formatMetric = (metric = '') => String(metric).replace(/_/g, ' ');

// Drop LLM placeholder values so we never render "Unknown" rows
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
  return !v || PLACEHOLDER_VALUES.has(v);
};

/**
 * Rich card rendering a Gemini-analyzed medical report.
 *
 * Gracefully handles all failure modes via `status`:
 *   ok / unsupported / empty / ai-unavailable / rate-limited / error
 */
const ReportSummaryCard = ({ payload, onExplainMedications, onFindSpecialist }) => {
  const [showMeds, setShowMeds] = useState(false);
  const [showSpecialists, setShowSpecialists] = useState(false);

  const { status = 'ok', analysis, message, fileName, disclaimer } = payload || {};

  // Non-OK states show a friendly fallback card
  if (status !== 'ok' || !analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="dash-card-static max-w-xl border-l-4 border-amber-400"
      >
        <div className="flex items-start gap-3">
          <div className="dash-icon-badge bg-amber-400 flex-shrink-0">
            <Info size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-heading font-bold text-[#0b1030] text-sm">
              {fileName || 'Report uploaded'}
            </h4>
            <p className="text-sm text-[#5f697a] mt-1">
              {message ||
                'Your report was uploaded but could not be auto-analyzed right now. You can still ask me questions about it.'}
            </p>
            {disclaimer && <p className="text-[11px] text-[#6a7283] mt-3 italic">{disclaimer}</p>}
          </div>
        </div>
      </motion.div>
    );
  }

  const {
    reportType = 'Medical Report',
    summary,
    keyFindings: rawKeyFindings = [],
    flags: rawFlags = [],
    recommendedActions: rawRecommendedActions = [],
    suggestedMedications: rawSuggestedMedications = [],
    suggestedSpecialists: rawSuggestedSpecialists = [],
  } = analysis;

  // Client-side defence: strip any placeholder-ish entries the LLM may have emitted
  const keyFindings = rawKeyFindings.filter(
    (f) => f && !isPlaceholder(f.metric) && !isPlaceholder(f.value)
  );
  const flags = rawFlags.filter((f) => f && !isPlaceholder(f.message));
  const recommendedActions = rawRecommendedActions.filter((a) => !isPlaceholder(a));
  const suggestedMedications = rawSuggestedMedications.filter((m) => m && !isPlaceholder(m.name));
  const suggestedSpecialists = rawSuggestedSpecialists.filter(
    (s) => s && !isPlaceholder(s.specialty)
  );

  const abnormalCount = keyFindings.filter((f) => f.status && f.status !== 'normal').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="dash-card-static max-w-xl"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
          <FileText size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#506cd7]">
              {reportType}
            </span>
            {abnormalCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {abnormalCount} flag{abnormalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h4 className="font-heading font-bold text-[#0b1030] text-sm truncate">
            {fileName || 'Report analysis'}
          </h4>
        </div>
      </div>

      {/* Summary */}
      {summary && <p className="text-sm text-[#1f2937] leading-relaxed mb-4">{summary}</p>}

      {/* Key findings */}
      {keyFindings.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#5f697a] mb-2">
            Key findings
          </h5>
          <div className="space-y-2">
            {keyFindings.map((f, i) => {
              const tone = statusMap[f.status] || statusMap.normal;
              return (
                <div
                  key={`${f.metric}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#e8eaf9] bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0b1030] truncate">
                      {formatMetric(f.metric)}
                    </p>
                    {f.normalRange && (
                      <p className="text-[10px] text-[#6a7283]">Normal range: {f.normalRange}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-[#0b1030]">{f.value || '—'}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone.bg} ${tone.color}`}
                    >
                      {tone.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {flags.map((flag, i) => {
            const tone = severityMap[flag.severity] || severityMap.moderate;
            return (
              <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${tone.bg}`}>
                <AlertTriangle size={14} className={`${tone.color} mt-0.5 flex-shrink-0`} />
                <p className="text-xs text-[#1f2937] leading-snug">{flag.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#5f697a] mb-2">
            Suggested next steps
          </h5>
          <ul className="space-y-1.5">
            {recommendedActions.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1f2937]">
                <CheckCircle size={14} className="text-[#506cd7] mt-1 flex-shrink-0" />
                <span className="leading-snug">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications */}
      {suggestedMedications.length > 0 && (
        <div className="mb-3 rounded-lg border border-[#e8eaf9] bg-[#f9faff]">
          <button
            type="button"
            onClick={() => setShowMeds((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
            aria-expanded={showMeds}
          >
            <span className="flex items-center gap-2 text-xs font-bold text-[#0b1030]">
              <Pill size={14} className="text-[#506cd7]" />
              Possible medications ({suggestedMedications.length})
            </span>
            {showMeds ? (
              <ChevronUp size={16} className="text-[#5f697a]" />
            ) : (
              <ChevronDown size={16} className="text-[#5f697a]" />
            )}
          </button>
          {showMeds && (
            <div className="px-3 pb-3 space-y-2">
              {suggestedMedications.map((m, i) => (
                <div
                  key={i}
                  className="text-sm text-[#1f2937] bg-white border border-[#e8eaf9] rounded-md px-3 py-2"
                >
                  <p className="font-semibold text-[#0b1030]">{m.name}</p>
                  {m.purpose && <p className="text-xs text-[#5f697a] mt-0.5">{m.purpose}</p>}
                </div>
              ))}
              {typeof onExplainMedications === 'function' && (
                <button
                  type="button"
                  onClick={() => onExplainMedications(suggestedMedications)}
                  className="text-xs font-semibold text-[#506cd7] hover:text-[#4753bf] inline-flex items-center gap-1 mt-1"
                >
                  Explain these medications →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Specialists */}
      {suggestedSpecialists.length > 0 && (
        <div className="mb-3 rounded-lg border border-[#e8eaf9] bg-[#f9faff]">
          <button
            type="button"
            onClick={() => setShowSpecialists((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
            aria-expanded={showSpecialists}
          >
            <span className="flex items-center gap-2 text-xs font-bold text-[#0b1030]">
              <Stethoscope size={14} className="text-[#506cd7]" />
              Recommended specialists ({suggestedSpecialists.length})
            </span>
            {showSpecialists ? (
              <ChevronUp size={16} className="text-[#5f697a]" />
            ) : (
              <ChevronDown size={16} className="text-[#5f697a]" />
            )}
          </button>
          {showSpecialists && (
            <div className="px-3 pb-3 space-y-2">
              {suggestedSpecialists.map((s, i) => (
                <div
                  key={i}
                  className="text-sm bg-white border border-[#e8eaf9] rounded-md px-3 py-2"
                >
                  <p className="font-semibold text-[#0b1030]">{s.specialty}</p>
                  {s.reason && <p className="text-xs text-[#5f697a] mt-0.5">{s.reason}</p>}
                  {typeof onFindSpecialist === 'function' && (
                    <button
                      type="button"
                      onClick={() => onFindSpecialist(s.specialty)}
                      className="text-xs font-semibold text-[#506cd7] hover:text-[#4753bf] mt-1.5"
                    >
                      Find nearby {s.specialty.toLowerCase()}s →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-[#e8eaf9] flex items-start gap-2">
        <ShieldAlert size={12} className="text-[#6a7283] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[#6a7283] leading-snug italic">
          {disclaimer ||
            'AI-generated analysis for educational purposes. Not a medical diagnosis — consult a healthcare professional.'}
        </p>
      </div>
    </motion.div>
  );
};

export default ReportSummaryCard;

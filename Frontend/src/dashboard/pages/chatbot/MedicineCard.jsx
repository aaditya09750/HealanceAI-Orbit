import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, ChevronDown, ChevronUp, AlertTriangle, Info, ShieldAlert, Zap } from 'lucide-react';

// Truncate at the nearest sentence boundary under `max` chars so the preview
// never ends mid-sentence. Falls back to a hard cut at `max` with ellipsis.
const makePreview = (text, max = 180) => {
  if (!text || text.length <= max) return text;
  const cut = text.lastIndexOf('. ', max);
  if (cut > 60) return text.slice(0, cut + 1).trim();
  return text.slice(0, max).trim() + '…';
};

// Keep long FDA label strings from blowing up the card. Show a preview and
// let the user expand.
const Collapsible = ({ label, text, icon: Icon = Info, accent = '#506cd7' }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const preview = makePreview(text, 180);
  const showToggle = preview !== text;

  return (
    <div className="mb-2 rounded-lg border border-[#e8eaf9] bg-[#f9faff] px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} style={{ color: accent }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f697a]">{label}</p>
      </div>
      <p className="text-xs text-[#1f2937] leading-relaxed whitespace-pre-line">
        {open ? text : preview}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 text-[11px] font-semibold text-[#506cd7] hover:text-[#4753bf] inline-flex items-center gap-1"
        >
          {open ? (
            <>
              Show less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show more <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

/**
 * Rich MedicineCard showing FDA-sourced info + RxNav drug class + highlighted
 * interactions against the user's current medications.
 *
 * payload shape matches the /api/chatbot/explain-medicine response:
 *   { status, medicine, disclaimer, message? }
 */
const MedicineCard = ({ payload }) => {
  const { status, medicine, disclaimer, message } = payload || {};

  // Not-found or error — friendly fallback
  if (status !== 'ok' || !medicine) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="dash-card-static border-l-4 border-amber-400"
      >
        <div className="flex items-start gap-3">
          <div className="dash-icon-badge bg-amber-400 flex-shrink-0">
            <Info size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-[#0b1030] text-sm">
              Couldn't find that medication
            </h4>
            <p className="text-sm text-[#5f697a] mt-1">
              {message ||
                'No FDA record was found for that medication. Please check the spelling or ask your pharmacist.'}
            </p>
            {disclaimer && <p className="text-[11px] text-[#6a7283] mt-3 italic">{disclaimer}</p>}
          </div>
        </div>
      </motion.div>
    );
  }

  const {
    name,
    genericName,
    drugClass,
    uses,
    dosage,
    sideEffects,
    warnings,
    interactions,
    contraindications,
    matchedInteractions = [],
    source,
  } = medicine;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="dash-card-static"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
          <Pill size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-bold text-[#0b1030] text-base truncate">{name}</h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            {genericName && genericName.toLowerCase() !== (name || '').toLowerCase() && (
              <span className="text-[11px] text-[#5f697a]">
                Generic: <span className="font-semibold text-[#0b1030]">{genericName}</span>
              </span>
            )}
            {drugClass && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f1fc] text-[#506cd7] capitalize">
                {drugClass}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interaction warning banner (red) — shown only if user's current meds matched label text */}
      {matchedInteractions.length > 0 && (
        <div className="mb-3 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-600" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Possible interaction with your current medication
              {matchedInteractions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ul className="space-y-1.5 mt-1.5">
            {matchedInteractions.map((m, i) => (
              <li key={i} className="text-xs text-red-800 leading-snug">
                <span className="font-bold">{m.drug}</span>
                {m.evidence && <span className="text-red-700/90"> — {m.evidence}</span>}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-red-800 mt-2 italic">
            Discuss with your doctor or pharmacist before taking both together.
          </p>
        </div>
      )}

      {/* Key sections */}
      <Collapsible label="What it's used for" text={uses} icon={Zap} accent="#506cd7" />
      <Collapsible label="Dosage & administration" text={dosage} icon={Pill} accent="#506cd7" />
      <Collapsible label="Side effects" text={sideEffects} icon={AlertTriangle} accent="#f59e0b" />
      <Collapsible label="Warnings" text={warnings} icon={ShieldAlert} accent="#ef4444" />
      <Collapsible
        label="Contraindications"
        text={contraindications}
        icon={ShieldAlert}
        accent="#ef4444"
      />
      <Collapsible
        label="Drug interactions"
        text={interactions}
        icon={AlertTriangle}
        accent="#f97316"
      />

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[#e8eaf9] flex items-start gap-2">
        <ShieldAlert size={12} className="text-[#6a7283] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[#6a7283] leading-snug italic">
          {disclaimer ||
            'Source: US FDA drug label. This is general information, not medical advice. Consult your doctor or pharmacist.'}
          {source && !disclaimer && ` (Source: ${source}.)`}
        </p>
      </div>
    </motion.div>
  );
};

export default MedicineCard;

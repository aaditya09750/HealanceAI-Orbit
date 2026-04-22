import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, HelpCircle, Loader2, ShieldAlert } from 'lucide-react';
import Button from '../../../shared/ui/Button';

const NOT_SURE = '__not_sure__';

const isBlank = (v) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const isAnswered = (v) => v === NOT_SURE || !isBlank(v);

// Treat these chip labels as "red flag triggered" answers.
const RED_FLAG_POSITIVE = new Set(['yes', 'cannot speak full sentences', 'severe', 'worst ever']);

const isRedFlagTriggered = (q, value) => {
  if (!q?.redFlag || !isAnswered(value) || value === NOT_SURE) return false;
  if (Array.isArray(value)) {
    return value.some((v) => RED_FLAG_POSITIVE.has(String(v).trim().toLowerCase()));
  }
  return RED_FLAG_POSITIVE.has(String(value).trim().toLowerCase());
};

// ─── Micro-components ────────────────────────────────────────────

const chipBase =
  'rounded-xl border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.97] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-2';
const chipInactive = 'bg-white text-[#0b1030] border-[#e8eaf9] hover:bg-[#f0f1fc]';
const chipActive = 'bg-[#506cd7] text-white border-[#506cd7]';
const chipNotSureIdle = 'bg-white text-[#6a7283] border-[#e8eaf9] border-dashed hover:bg-[#f0f1fc]';
const chipNotSureActive = 'bg-[#f0f1fc] text-[#6a7283] border-[#c6cdf0] border-dashed';

function NotSureChip({ active, onClick, describedBy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label="Mark this question as not sure"
      aria-describedby={describedBy}
      className={`${chipBase} ${active ? chipNotSureActive : chipNotSureIdle}`}
    >
      <HelpCircle size={14} className="mr-1.5" />
      I'm not sure
    </button>
  );
}

function ChipQuestion({ question, value, onChange }) {
  const notSure = value === NOT_SURE;
  return (
    <div
      role="radiogroup"
      aria-labelledby={`q-legend-${question.id}`}
      className="flex flex-wrap gap-2"
    >
      {question.options.map((opt) => {
        const active = !notSure && value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? '' : opt)}
            className={`${chipBase} ${active ? chipActive : chipInactive}`}
          >
            {opt}
          </button>
        );
      })}
      <NotSureChip
        active={notSure}
        onClick={() => onChange(notSure ? '' : NOT_SURE)}
        describedBy={`q-legend-${question.id}`}
      />
    </div>
  );
}

function MultiSelectQuestion({ question, value, onChange }) {
  const notSure = value === NOT_SURE;
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (notSure) {
      onChange([opt]);
      return;
    }
    if (arr.includes(opt)) onChange(arr.filter((v) => v !== opt));
    else onChange([...arr, opt]);
  };
  return (
    <div role="group" aria-labelledby={`q-legend-${question.id}`} className="flex flex-wrap gap-2">
      {question.options.map((opt) => {
        const active = !notSure && arr.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt)}
            className={`${chipBase} ${active ? chipActive : chipInactive}`}
          >
            {opt}
          </button>
        );
      })}
      <NotSureChip
        active={notSure}
        onClick={() => onChange(notSure ? [] : NOT_SURE)}
        describedBy={`q-legend-${question.id}`}
      />
    </div>
  );
}

function NumberQuestion({ question, value, onChange }) {
  const notSure = value === NOT_SURE;
  const display = notSure || value === undefined || value === null ? '' : String(value);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <input
          id={`q-input-${question.id}`}
          type="number"
          inputMode="decimal"
          disabled={notSure}
          value={display}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') onChange('');
            else {
              const n = Number(raw);
              onChange(Number.isFinite(n) ? n : '');
            }
          }}
          min={question.min}
          max={question.max}
          aria-labelledby={`q-legend-${question.id}`}
          aria-describedby={question.helpText ? `q-help-${question.id}` : undefined}
          placeholder={question.unit ? `e.g. 101 ${question.unit}` : 'Enter a number'}
          className={`dash-input w-full pr-16 ${notSure ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {question.unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6a7283]">
            {question.unit}
          </span>
        )}
      </div>
      <NotSureChip
        active={notSure}
        onClick={() => onChange(notSure ? '' : NOT_SURE)}
        describedBy={`q-legend-${question.id}`}
      />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────

const AdaptiveQuestions = ({
  questions = [],
  answers = {},
  onChange,
  onBack,
  onSubmit,
  loading = false,
  submitting = false,
  loadError = '',
  onRetry,
  onPredictWithout,
}) => {
  const [shakeId, setShakeId] = useState(null);
  const fieldRefs = useRef({});

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [questions, answers]
  );

  const redFlagTriggered = useMemo(
    () => questions.some((q) => isRedFlagTriggered(q, answers[q.id])),
    [questions, answers]
  );

  const allRequiredAnswered = useMemo(
    () => questions.filter((q) => q.required).every((q) => isAnswered(answers[q.id])),
    [questions, answers]
  );

  // Announce progress changes politely to assistive tech.
  const ariaProgress = `Question ${answeredCount} of ${questions.length} answered`;

  useEffect(() => {
    if (!shakeId) return;
    const t = setTimeout(() => setShakeId(null), 600);
    return () => clearTimeout(t);
  }, [shakeId]);

  const handleSubmit = () => {
    if (!allRequiredAnswered) {
      const firstMissing = questions.find((q) => q.required && !isAnswered(answers[q.id]));
      if (firstMissing) {
        setShakeId(firstMissing.id);
        const el = fieldRefs.current[firstMissing.id];
        if (el && typeof el.focus === 'function') el.focus({ preventScroll: false });
        else if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    onSubmit?.();
  };

  // ─── Loading state ────────────────────────────────────────────

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="dash-card-static"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={16} className="text-[#506cd7]" />
          <h3 className="text-sm sm:text-base font-heading font-bold text-[#0b1030]">
            Loading follow-up questions…
          </h3>
        </div>
        <p className="text-xs text-[#6a7283] mb-5">
          Building a short set based on the symptoms you selected.
        </p>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div
                className="animate-pulse rounded-md"
                style={{ width: '40%', height: 14, backgroundColor: '#eef1ff' }}
              />
              <div
                className="mt-2 animate-pulse rounded-xl"
                style={{ width: '100%', height: 44, backgroundColor: '#eef1ff' }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Load-error state ────────────────────────────────────────

  if (loadError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="dash-card-static"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-[#0b1030]">
              Couldn't load follow-up questions
            </h3>
            <p className="text-sm text-[#5f697a] mt-1">{loadError}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to symptoms
          </Button>
          {onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          )}
          {onPredictWithout && (
            <Button type="button" onClick={onPredictWithout} disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Predicting…
                </span>
              ) : (
                'Predict without follow-ups'
              )}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── Empty-questions state ──────────────────────────────────

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="dash-card-static"
      >
        <h3 className="text-sm sm:text-base font-heading font-bold text-[#0b1030]">
          Tell us a bit more
        </h3>
        <p className="text-sm text-[#5f697a] mt-1">
          No additional details needed — tap Predict to continue.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="secondary" onClick={onBack}>
            <span className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Back to symptoms
            </span>
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Predicting…
              </span>
            ) : (
              'Predict Disease'
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Main render ───────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="dash-card-static"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm sm:text-base font-heading font-bold text-[#0b1030]">
            Tell us a bit more
          </h3>
          <p className="text-xs text-[#6a7283] mt-0.5">
            A few quick questions make the prediction much more accurate.
          </p>
        </div>
        <span
          role="status"
          aria-live="polite"
          className="text-xs font-semibold text-[#506cd7] bg-[#f0f1fc] rounded-full px-2.5 py-1 whitespace-nowrap"
        >
          {answeredCount} / {questions.length}
        </span>
        <span className="sr-only">{ariaProgress}</span>
      </div>

      <div className="mt-5 space-y-5">
        {questions.map((q) => {
          const value = answers[q.id];
          const shaking = shakeId === q.id;
          return (
            <motion.fieldset
              key={q.id}
              ref={(el) => {
                fieldRefs.current[q.id] = el;
              }}
              tabIndex={-1}
              animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              className="border-0 p-0 m-0"
            >
              <legend
                id={`q-legend-${q.id}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#0b1030] mb-2"
              >
                {q.redFlag && (
                  <span className="text-amber-600" aria-hidden="true">
                    <AlertTriangle size={14} />
                  </span>
                )}
                {q.redFlag && <span className="sr-only">Important: </span>}
                <span>
                  {q.label}
                  {q.required && (
                    <span className="text-[#ef4444] ml-0.5" aria-hidden="true">
                      *
                    </span>
                  )}
                </span>
              </legend>
              {q.helpText && (
                <p id={`q-help-${q.id}`} className="text-xs text-[#6a7283] mb-2">
                  {q.helpText}
                </p>
              )}
              {q.type === 'chip' && (
                <ChipQuestion question={q} value={value} onChange={(v) => onChange(q.id, v)} />
              )}
              {q.type === 'multiselect' && (
                <MultiSelectQuestion
                  question={q}
                  value={value}
                  onChange={(v) => onChange(q.id, v)}
                />
              )}
              {q.type === 'number' && (
                <NumberQuestion question={q} value={value} onChange={(v) => onChange(q.id, v)} />
              )}
            </motion.fieldset>
          );
        })}
      </div>

      <AnimatePresence>
        {redFlagTriggered && (
          <motion.div
            key="redflag"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-5 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2.5 flex items-start gap-2"
          >
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-snug">
              Some of your answers suggest urgent care may be appropriate. You can still get an AI
              prediction, but please also consider calling your doctor or going to the nearest
              clinic.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>
          <span className="inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to symptoms
          </span>
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !allRequiredAnswered}
          aria-disabled={!allRequiredAnswered}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Predicting…
            </span>
          ) : (
            'Predict Disease'
          )}
        </Button>
      </div>
      {!allRequiredAnswered && (
        <p className="text-[11px] text-[#6a7283] mt-2 text-right">
          Answer the required questions marked <span className="text-[#ef4444]">*</span> to
          continue. Tap "I'm not sure" if you don't know.
        </p>
      )}
    </motion.div>
  );
};

export default AdaptiveQuestions;
export { NOT_SURE, isAnswered };

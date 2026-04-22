import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Loader2,
  MessageCircle,
  Pill,
  ShieldCheck,
  Soup,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { riskService } from '../../services/api';
import Button from '../../shared/ui/Button';
import DashReveal from '../../shared/ui/DashReveal';
import CircularGauge from '../../shared/ui/CircularGauge';
import { useAuth } from '../../context/AuthContext';
import AdaptiveQuestions, { NOT_SURE, isAnswered } from './risk/AdaptiveQuestions';

const SYMPTOM_LABELS = {
  fever: 'Fever',
  cough: 'Cough',
  headache: 'Headache',
  fatigue: 'Fatigue',
  vomiting: 'Vomiting',
  chest_pain: 'Chest Pain',
  sore_throat: 'Sore Throat',
  breathlessness: 'Breathlessness',
  nausea: 'Nausea',
  dizziness: 'Dizziness',
  body_pain: 'Body Pain',
  diarrhea: 'Diarrhea',
  skin_rash: 'Skin Rash',
  itching: 'Itching',
  weight_loss: 'Weight Loss',
  sweating: 'Sweating',
};

const initialSymptoms = Object.keys(SYMPTOM_LABELS).reduce((acc, key) => {
  acc[key] = false;
  return acc;
}, {});

const confidenceText = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return `${Math.round(value * 100)}%`;
};

const PredictionRow = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const hasReasoning = typeof item.reasoning === 'string' && item.reasoning.trim().length > 0;
  return (
    <div className="rounded-xl border border-[#e8eaf9] overflow-hidden hover:border-[#506cd7]/30 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between px-3 py-2 bg-white">
        <span className="text-sm font-medium text-[#0b1030] truncate pr-2">{item.disease}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-[#506cd7] bg-[#f0f1fc] px-2 py-0.5 rounded-full">
            {confidenceText(item.confidence)}
          </span>
          {hasReasoning && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={`reasoning-${index}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#506cd7] hover:text-[#4753bf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-2 rounded-md px-1.5 py-0.5"
            >
              {open ? (
                <>
                  Hide <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Why this? <ChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && hasReasoning && (
          <motion.div
            id={`reasoning-${index}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-[#5f697a] leading-relaxed bg-[#f9faff] px-3 py-2 border-t border-[#e8eaf9]">
              {item.reasoning}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RiskPrediction = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // phase: 'select' | 'questions' | 'result'
  const [phase, setPhase] = useState('select');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [questionsVersion, setQuestionsVersion] = useState(null);
  const questionsSectionRef = useRef(null);

  const selectedSymptoms = useMemo(
    () =>
      Object.entries(symptoms)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
    [symptoms]
  );

  // If any selected symptom is removed, purge answers for questions that
  // depend on it so stale answers don't get sent to the backend.
  const pruneAnswersForSymptoms = useCallback((currentQuestions, nextSelectedKeys) => {
    const keep = new Set(nextSelectedKeys.concat(['general', 'personalized']));
    const stillValid = new Set(
      currentQuestions.filter((q) => keep.has(q.symptom)).map((q) => q.id)
    );
    setAnswers((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (stillValid.has(k)) next[k] = v;
      }
      return next;
    });
  }, []);

  const toggleSymptom = (key) => {
    setSymptoms((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Reset phase back to 'select' if user edits after moving on.
      if (phase !== 'select') {
        setPhase('select');
        setQuestions([]);
        setQuestionsError('');
        const nextSelected = Object.entries(next)
          .filter(([, v]) => v)
          .map(([k]) => k);
        pruneAnswersForSymptoms(questions, nextSelected);
      }
      return next;
    });
    if (result) setResult(null);
  };

  const resetAll = () => {
    setSymptoms(initialSymptoms);
    setResult(null);
    setError('');
    setMessage('');
    setPhase('select');
    setQuestions([]);
    setAnswers({});
    setQuestionsError('');
    setQuestionsVersion(null);
  };

  const buildProfilePayload = useCallback(() => {
    const p = user?.profile || {};
    return {
      age: Number.isFinite(p.age) ? p.age : null,
      gender: p.gender || null,
      medicalConditions: Array.isArray(p.medicalConditions) ? p.medicalConditions : [],
      medications: Array.isArray(p.medications) ? p.medications : [],
    };
  }, [user]);

  const fetchQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError('');
    try {
      const response = await riskService.getAdaptiveQuestions({
        symptoms: selectedSymptoms,
        profile: buildProfilePayload(),
      });
      if (response?.success && Array.isArray(response.questions)) {
        setQuestions(response.questions);
        setQuestionsVersion(response.version || null);
      } else {
        setQuestions([]);
      }
    } catch (apiError) {
      setQuestionsError(
        apiError?.response?.data?.message || 'We could not load follow-up questions right now.'
      );
    } finally {
      setQuestionsLoading(false);
    }
  }, [selectedSymptoms, buildProfilePayload]);

  const handleContinue = async (event) => {
    event?.preventDefault?.();
    setError('');
    setMessage('');
    setResult(null);

    if (selectedSymptoms.length < 2) {
      setError('Please select at least 2 symptoms for better prediction.');
      return;
    }

    setPhase('questions');
    await fetchQuestions();
    // Bring the new card into view on mobile.
    window.requestAnimationFrame(() => {
      questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleBackToSymptoms = () => {
    setPhase('select');
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const buildContextualPayload = () => {
    const out = {};
    for (const q of questions) {
      const v = answers[q.id];
      if (!isAnswered(v)) continue;
      if (v === NOT_SURE) {
        out[q.id] = null;
        continue;
      }
      out[q.id] = v;
    }
    return out;
  };

  const runPrediction = async ({ withContext = true } = {}) => {
    try {
      setIsLoading(true);
      setError('');
      const payload = Object.keys(symptoms).reduce((acc, key) => {
        acc[key] = symptoms[key];
        return acc;
      }, {});
      if (withContext) {
        payload.contextualAnswers = buildContextualPayload();
        if (questionsVersion) payload.adaptiveQuestionsVersion = questionsVersion;
      }

      const response = await riskService.predictSymptomsDisease(payload);
      if (response.success) {
        setResult(response);
        setPhase('result');
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Prediction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredict = () => runPrediction({ withContext: true });
  const handlePredictWithout = () => runPrediction({ withContext: false });

  const handleShareWhatsapp = async () => {
    if (!result) return;

    try {
      setIsSharing(true);
      setError('');
      setMessage('');

      const response = await riskService.shareSymptomsToWhatsapp({
        predictedDisease: result.predictedDisease,
        confidence: result.confidence,
        topPredictions: result.topPredictions,
        selectedSymptoms: result.selectedSymptoms,
        details: result.details,
      });

      setMessage(response.message || 'Prediction summary sent on WhatsApp.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to share on WhatsApp right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const details = result?.details || {};

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashReveal>
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#506cd7' }}>
          <div className="mb-6 sm:mb-8 flex items-start gap-3">
            <div className="dash-icon-badge dash-icon-badge--gradient-indigo hidden sm:inline-flex">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030]">
                <span className="dash-gradient-text">Symptoms Disease Prediction</span>
              </h2>
              <p className="text-sm sm:text-base text-[#5f697a] mt-1">
                Select symptoms and the AI model will suggest the most likely disease along with
                diet, workout, precautions, and medications.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleContinue}>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSymptom(key)}
                  aria-pressed={symptoms[key]}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors text-left active:scale-[0.97] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-2 ${
                    symptoms[key]
                      ? 'bg-[#506cd7] text-white border-[#506cd7]'
                      : 'bg-white text-[#0b1030] border-[#e8eaf9] hover:bg-[#f0f1fc]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </motion.div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-[#5f697a]">
                Selected:{' '}
                <span className="font-semibold text-[#0b1030]">{selectedSymptoms.length}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={resetAll}>
                  Reset
                </Button>
                <Button type="submit" disabled={questionsLoading || selectedSymptoms.length < 2}>
                  {questionsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Loading follow-ups…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Continue to follow-up questions
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {selectedSymptoms.length > 0 && selectedSymptoms.length < 2 && (
              <p className="text-xs text-[#6a7283]">Select at least 2 symptoms to continue.</p>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>
        </div>
      </DashReveal>

      {phase !== 'select' && (
        <div ref={questionsSectionRef}>
          <AdaptiveQuestions
            questions={questions}
            answers={answers}
            loading={questionsLoading}
            loadError={questionsError}
            submitting={isLoading}
            onChange={handleAnswerChange}
            onBack={handleBackToSymptoms}
            onSubmit={handlePredict}
            onRetry={fetchQuestions}
            onPredictWithout={handlePredictWithout}
          />
        </div>
      )}

      {result && (
        <motion.div
          className="space-y-6 sm:space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="dash-card-hero flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <CircularGauge
                value={Math.round((result.confidence || 0) * 100)}
                size={120}
                stroke={10}
                label="Confidence"
                suffix="%"
              />
            </div>
            <div className="min-w-0 flex-1 relative z-10">
              <p className="text-xs uppercase tracking-[0.25em] font-semibold text-[#506cd7]">
                Predicted Disease
              </p>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030] mt-1">
                {result.predictedDisease}
              </h3>
              {result.refinementApplied && (
                <span
                  title={
                    result.refinementReasons && result.refinementReasons.length
                      ? result.refinementReasons.join(' • ')
                      : 'Adjusted using your follow-up answers'
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#506cd7] bg-white/80 rounded-full px-2 py-1 mt-2"
                >
                  <Sparkles size={12} />
                  Refined with your answers
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-indigo"
                  style={{ width: 32, height: 32 }}
                >
                  <Activity size={14} className="text-white" />
                </span>
                Description
              </h4>
              <p className="text-sm text-[#5f697a]">
                {details.description || 'Description not available for this disease.'}
              </p>
            </div>

            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-amber"
                  style={{ width: 32, height: 32 }}
                >
                  <AlertTriangle size={14} className="text-white" />
                </span>
                Top Predictions
              </h4>
              <div className="space-y-2">
                {(result.topPredictions || []).map((item, idx) => (
                  <PredictionRow key={`${item.disease}-${idx}`} item={item} index={idx} />
                ))}
              </div>
              {result.topPredictions?.some((p) => p.reasoning) && (
                <p className="text-[11px] text-[#6a7283] italic pt-1">
                  Tap "Why this?" on any prediction to see the clinical reasoning.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-emerald"
                  style={{ width: 32, height: 32 }}
                >
                  <ShieldCheck size={14} className="text-white" />
                </span>
                Precautions
              </h4>
              <ul className="space-y-2 text-sm text-[#5f697a] list-disc pl-5">
                {(details.precautions || []).length > 0 ? (
                  details.precautions.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No precautions available.</li>
                )}
              </ul>
            </div>

            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-rose"
                  style={{ width: 32, height: 32 }}
                >
                  <Pill size={14} className="text-white" />
                </span>
                Medications
              </h4>
              <ul className="space-y-2 text-sm text-[#5f697a] list-disc pl-5">
                {(details.medications || []).length > 0 ? (
                  details.medications.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No medication guidance available.</li>
                )}
              </ul>
            </div>

            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-amber"
                  style={{ width: 32, height: 32 }}
                >
                  <Soup size={14} className="text-white" />
                </span>
                Diet Plan
              </h4>
              <ul className="space-y-2 text-sm text-[#5f697a] list-disc pl-5">
                {(details.diets || []).length > 0 ? (
                  details.diets.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No diet suggestions available.</li>
                )}
              </ul>
            </div>

            <div className="dash-card dash-card-glow space-y-3">
              <h4 className="dash-heading text-sm sm:text-base flex items-center gap-2">
                <span
                  className="dash-icon-badge dash-icon-badge--gradient-cyan"
                  style={{ width: 32, height: 32 }}
                >
                  <Dumbbell size={14} className="text-white" />
                </span>
                Workout Plan
              </h4>
              <ul className="space-y-2 text-sm text-[#5f697a] list-disc pl-5">
                {(details.workouts || []).length > 0 ? (
                  details.workouts.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No workout suggestions available.</li>
                )}
              </ul>
            </div>
          </div>

          {(details.riskFactors || []).length > 0 && (
            <div className="dash-card-static space-y-3">
              <h4 className="dash-heading text-sm sm:text-base">Risk Factors</h4>
              <ul className="space-y-2 text-sm text-[#5f697a] list-disc pl-5">
                {details.riskFactors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="dash-card-static">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-[#5f697a]">
                Share this complete report, including all suggestions, on WhatsApp.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleShareWhatsapp}
                disabled={isSharing}
              >
                {isSharing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle size={16} />
                    Send Full Result on WhatsApp
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {message && <p className="text-sm font-medium text-[#5f697a]">{message}</p>}
    </div>
  );
};

export default RiskPrediction;

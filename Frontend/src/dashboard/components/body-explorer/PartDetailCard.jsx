import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Activity,
  MessageCircle,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

/**
 * Rich body-part detail card (mobile bottom-sheet + desktop side card).
 * Displays backend-provided part info with three action buttons that
 * deep-link into other Healance features:
 *   - Symptoms Predictor (pre-selected related conditions)
 *   - Heart & Diabetes predictor (when applicable)
 *   - AI Chatbot (pre-seeded prompt)
 */
const PartDetailCard = ({ partName, partInfo, loading, error, onClose }) => {
  return (
    <AnimatePresence>
      {partName && (loading || partInfo || error) && (
        <>
          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed sm:hidden inset-x-0 bottom-0 z-50
                       bg-white rounded-t-2xl shadow-2xl border-t border-slate-200
                       max-h-[78vh] flex flex-col"
            role="dialog"
            aria-label={`${partName} details`}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <CardHeader partName={partName} partInfo={partInfo} onClose={onClose} />
            <CardContent partName={partName} partInfo={partInfo} loading={loading} error={error} />
          </motion.div>

          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed sm:hidden inset-0 z-40 bg-black/20"
            onClick={onClose}
          />

          {/* Desktop: side card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute hidden sm:flex top-3 right-3 z-20
                       w-72 lg:w-80 max-h-[calc(100%-5rem)]
                       bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60
                       overflow-hidden flex-col"
            role="dialog"
            aria-label={`${partName} details`}
          >
            <CardHeader partName={partName} partInfo={partInfo} onClose={onClose} />
            <CardContent partName={partName} partInfo={partInfo} loading={loading} error={error} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CardHeader = ({ partName, partInfo, onClose }) => (
  <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
    <div className="min-w-0">
      <h3 className="text-white font-bold text-sm sm:text-base truncate">{partName}</h3>
      {partInfo?.system && (
        <p className="text-white/80 text-[10px] sm:text-[11px] uppercase tracking-wider mt-0.5">
          {formatSystem(partInfo.system)} system
        </p>
      )}
    </div>
    <button
      onClick={onClose}
      className="p-1 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white flex-shrink-0"
      aria-label="Close details"
    >
      <X size={16} />
    </button>
  </div>
);

const CardContent = ({ partName, partInfo, loading, error }) => {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!partInfo) return null;

  return (
    <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 overflow-y-auto scrollbar-hide flex-1 text-xs">
      <p className="text-slate-600 leading-relaxed">{partInfo.function}</p>

      {partInfo.metrics && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
            <Activity size={12} className="text-red-500" /> Reference
          </span>
          <span className="font-bold text-slate-800 text-[11px] text-right">
            {partInfo.metrics}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
        {partInfo.diseases?.length > 0 && (
          <InfoCard tone="red" icon={AlertCircle} title="Diseases" items={partInfo.diseases} />
        )}

        {partInfo.tests?.length > 0 && (
          <InfoCard tone="blue" icon={Stethoscope} title="Tests" items={partInfo.tests} />
        )}
      </div>

      {partInfo.symptoms?.length > 0 && (
        <InfoCard
          tone="amber"
          icon={AlertCircle}
          title="Red-flag symptoms"
          items={partInfo.symptoms}
        />
      )}

      {partInfo.prevention?.length > 0 && (
        <div className="bg-green-50 p-2.5 sm:p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5 text-green-700 font-bold text-[11px]">
            <ShieldCheck size={12} /> Prevention
          </div>
          <div className="flex flex-wrap gap-1">
            {partInfo.prevention.map((p, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-green-700 border border-green-100"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <ActionButtons partName={partName} partInfo={partInfo} />
    </div>
  );
};

const InfoCard = ({ tone, icon: Icon, title, items }) => {
  const tones = {
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  }[tone];
  return (
    <div className={`${tones.bg} p-2.5 sm:p-3 rounded-xl`}>
      <div className={`flex items-center gap-1.5 mb-1.5 ${tones.text} font-bold text-[11px]`}>
        <Icon size={12} /> {title}
      </div>
      <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
        {items.slice(0, 5).map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
};

const ActionButtons = ({ partName, partInfo }) => {
  const navigate = useNavigate();
  const links = Array.isArray(partInfo.relatedLinks) ? partInfo.relatedLinks : [];
  const hasHeartDiabetes = links.includes('predict:heart-diabetes');
  const hasSymptoms = links.includes('predict:symptoms');
  const hasChatbot = links.includes('chatbot:health');

  if (!hasHeartDiabetes && !hasSymptoms && !hasChatbot) return null;

  const handleAskAI = () => {
    const condition = partInfo.diseases?.[0] || partName;
    const query = encodeURIComponent(
      `Tell me about ${partName.toLowerCase()} health — common issues like ${condition} and how to stay well.`
    );
    navigate(`/dashboard/chatbots?bot=health&prompt=${query}`);
  };
  const handleCheckSymptoms = () => {
    navigate('/dashboard/risk-prediction');
  };
  const handleHeartDiabetes = () => {
    navigate('/dashboard/risk-prediction/heart-diabetes');
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
        <Sparkles size={10} className="inline -mt-0.5 mr-1 text-red-500" />
        Explore more
      </p>
      <div className="grid gap-1.5">
        {hasHeartDiabetes && (
          <ActionButton
            onClick={handleHeartDiabetes}
            label="Check your heart & diabetes risk"
            icon={ArrowRight}
            tone="red"
          />
        )}
        {hasSymptoms && (
          <ActionButton
            onClick={handleCheckSymptoms}
            label="Run a symptom check"
            icon={ArrowRight}
            tone="slate"
          />
        )}
        {hasChatbot && (
          <ActionButton
            onClick={handleAskAI}
            label={`Ask AI about the ${partName}`}
            icon={MessageCircle}
            tone="blue"
          />
        )}
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, label, icon: Icon, tone = 'slate' }) => {
  const tones = {
    red: 'bg-red-600 text-white hover:bg-red-700',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    slate: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-2 ${tones}`}
    >
      <span className="truncate text-left">{label}</span>
      <Icon size={12} className="flex-shrink-0" />
    </button>
  );
};

const LoadingState = () => (
  <div className="p-4 flex items-center gap-2 text-slate-500 text-xs">
    <Loader2 size={14} className="animate-spin" />
    Loading details…
  </div>
);

const ErrorState = ({ message }) => (
  <div className="p-4 text-xs text-red-700 bg-red-50 m-3 rounded-xl border border-red-100">
    {message || 'Could not load details for this body part.'}
  </div>
);

const formatSystem = (system) => {
  if (!system) return '';
  return system.charAt(0).toUpperCase() + system.slice(1);
};

export default PartDetailCard;

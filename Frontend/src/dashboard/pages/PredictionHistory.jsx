import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  CalendarClock,
  ChevronRight,
  Heart,
  ListChecks,
  Loader2,
  FileDown,
} from 'lucide-react';
import { riskService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../shared/ui/Button';

// Lazy-load the PDF library + report components only when the user clicks Generate.
// Keeps the main bundle lean and ensures zero initial-load breakage.
const generatePdfBlob = async ({ heartPrediction, symptomsPrediction, user }) => {
  const [{ pdf }, ReportModule] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/reports/ReportDocument'),
  ]);
  const ReportDocument = ReportModule.default;
  const { getReportFilename } = ReportModule;
  const blob = await pdf(
    <ReportDocument
      heartPrediction={heartPrediction}
      symptomsPrediction={symptomsPrediction}
      user={user}
    />
  ).toBlob();
  return { blob, filename: getReportFilename(user) };
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the download has time to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Badge = ({ children, tone = 'default' }) => {
  const toneStyles = {
    default: {
      background: 'linear-gradient(135deg, rgba(80, 108, 215, 0.12), rgba(14, 165, 233, 0.12))',
      color: '#506cd7',
    },
    success: {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15))',
      color: '#047857',
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15))',
      color: '#b45309',
    },
    danger: {
      background: 'linear-gradient(135deg, rgba(231, 76, 76, 0.15), rgba(251, 113, 133, 0.15))',
      color: '#b91c1c',
    },
  };

  const style = toneStyles[tone] || toneStyles.default;

  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={style}>
      {children}
    </span>
  );
};

const SectionCard = ({ title, children, icon: Icon }) => (
  <div className="rounded-xl border border-[#e8eaf9] bg-white p-4">
    <div className="flex items-center gap-2 mb-3">
      {Icon ? <Icon size={16} className="text-[#506cd7]" /> : null}
      <h4 className="text-sm font-semibold text-[#0b1030]">{title}</h4>
    </div>
    {children}
  </div>
);

const ListBlock = ({ items, emptyText = 'Not available' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-[#5f697a]">{emptyText}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="text-sm text-[#1f2937] flex gap-2">
          <span className="mt-1 text-[#506cd7]">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const HistoryList = ({ items, selectedId, onSelect, type }) => {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#d7dbf6] bg-[#fafbff] p-6 text-center">
        <p className="text-sm text-[#5f697a]">No predictions found yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[560px] overflow-y-auto scrollbar-hide pr-1">
      {items.map((item) => {
        const isActive = selectedId === item._id;
        const title =
          type === 'heart'
            ? `Overall: ${(item.results?.overallRisk || 'low').toUpperCase()}`
            : item.predictedDisease;

        const subline =
          type === 'heart'
            ? `Heart ${typeof item.results?.heartDiseaseRisk === 'number' ? `${item.results.heartDiseaseRisk}%` : 'N/A'} • Diabetes ${typeof item.results?.diabetesRisk === 'number' ? `${item.results.diabetesRisk}%` : 'N/A'}`
            : `Confidence ${typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : 'N/A'}`;

        const iconClass =
          type === 'heart' ? 'dash-icon-badge--gradient-rose' : 'dash-icon-badge--gradient-indigo';
        const Icon = type === 'heart' ? Heart : Brain;

        return (
          <button
            key={item._id}
            type="button"
            onClick={() => onSelect(item)}
            className={`group w-full text-left rounded-xl border p-3 transition-all ${
              isActive
                ? 'border-[#506cd7] bg-[#f3f5ff] shadow-sm'
                : 'border-[#e8eaf9] bg-white hover:bg-[#f9faff] hover:border-[#506cd7]/30'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`dash-icon-badge ${iconClass} flex-shrink-0`}
                style={{ width: 32, height: 32 }}
              >
                <Icon size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0b1030] truncate">{title}</p>
                <p className="text-xs text-[#5f697a] mt-0.5">{subline}</p>
                <p className="text-[10px] text-[#9aa3b2] mt-1.5">{formatDate(item.createdAt)}</p>
              </div>
              <ChevronRight
                size={16}
                className="text-[#9aa3b2] mt-2 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

const HeartDetail = ({ item }) => {
  if (!item) {
    return (
      <p className="text-sm text-[#5f697a]">
        Select a heart/diabetes prediction to see full details.
      </p>
    );
  }

  const overallRisk = item.results?.overallRisk || 'low';
  const riskTone =
    overallRisk === 'critical' || overallRisk === 'high'
      ? 'danger'
      : overallRisk === 'moderate'
        ? 'warning'
        : 'success';

  return (
    <div className="space-y-4">
      <SectionCard title="Summary" icon={Activity}>
        <div className="flex items-center gap-2 mb-3">
          <Badge tone={riskTone}>Overall {overallRisk.toUpperCase()}</Badge>
          <span className="text-xs text-[#6a7283]">{formatDate(item.createdAt)}</span>
        </div>
        <p className="text-sm text-[#1f2937] mb-3">
          {item.results?.summary || 'No summary available.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#f8f9ff] border border-[#edf0ff] p-2">
            <p className="text-xs text-[#6a7283]">Heart Risk</p>
            <p className="text-sm font-bold text-[#0b1030]">
              {typeof item.results?.heartDiseaseRisk === 'number'
                ? `${item.results.heartDiseaseRisk}%`
                : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg bg-[#f8f9ff] border border-[#edf0ff] p-2">
            <p className="text-xs text-[#6a7283]">Diabetes Risk</p>
            <p className="text-sm font-bold text-[#0b1030]">
              {typeof item.results?.diabetesRisk === 'number'
                ? `${item.results.diabetesRisk}%`
                : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg bg-[#f8f9ff] border border-[#edf0ff] p-2">
            <p className="text-xs text-[#6a7283]">Stroke Risk</p>
            <p className="text-sm font-bold text-[#0b1030]">
              {typeof item.results?.strokeRisk === 'number' ? `${item.results.strokeRisk}%` : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg bg-[#f8f9ff] border border-[#edf0ff] p-2">
            <p className="text-xs text-[#6a7283]">BP Risk</p>
            <p className="text-sm font-bold text-[#0b1030]">
              {typeof item.results?.bpRisk === 'number' ? `${item.results.bpRisk}%` : 'N/A'}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Input Values" icon={ListChecks}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">Age:</span> {item.input?.age ?? 'N/A'}
          </p>
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">Gender:</span> {item.input?.gender ?? 'N/A'}
          </p>
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">BMI:</span> {item.input?.bmi ?? 'N/A'}
          </p>
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">BP:</span> {item.input?.bloodPressure ?? 'N/A'}
          </p>
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">Cholesterol:</span> {item.input?.cholesterol ?? 'N/A'}
          </p>
          <p className="text-[#1f2937]">
            <span className="text-[#6a7283]">Blood Sugar:</span> {item.input?.bloodSugar ?? 'N/A'}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Recommendations" icon={Heart}>
        <ListBlock
          items={item.results?.recommendations || []}
          emptyText="No recommendations available."
        />
      </SectionCard>

      <SectionCard title="Diet Plan" icon={Heart}>
        <div className="space-y-1 text-sm text-[#1f2937]">
          <p>
            <span className="text-[#6a7283]">Breakfast:</span> {item.dietPlan?.breakfast || 'N/A'}
          </p>
          <p>
            <span className="text-[#6a7283]">Lunch:</span> {item.dietPlan?.lunch || 'N/A'}
          </p>
          <p>
            <span className="text-[#6a7283]">Dinner:</span> {item.dietPlan?.dinner || 'N/A'}
          </p>
          <p>
            <span className="text-[#6a7283]">Snacks:</span> {item.dietPlan?.snacks || 'N/A'}
          </p>
          <p>
            <span className="text-[#6a7283]">Notes:</span> {item.dietPlan?.notes || 'N/A'}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Workout Plan" icon={Heart}>
        {(item.workoutPlan || []).length ? (
          <div className="space-y-2">
            {item.workoutPlan.map((w, idx) => (
              <div
                key={`${w.day}-${idx}`}
                className="text-sm text-[#1f2937] rounded-lg bg-[#f8f9ff] border border-[#edf0ff] px-3 py-2"
              >
                {w.day || 'Day'}: {w.exercise || 'Exercise'} ({w.duration || 'N/A'})
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5f697a]">No workout plan available.</p>
        )}
      </SectionCard>
    </div>
  );
};

const SymptomsDetail = ({ item }) => {
  if (!item) {
    return (
      <p className="text-sm text-[#5f697a]">Select a symptoms prediction to see full details.</p>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Summary" icon={Brain}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge>{item.predictedDisease || 'N/A'}</Badge>
          <span className="text-xs text-[#6a7283]">
            Confidence:{' '}
            {typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
          </span>
          <span className="text-xs text-[#6a7283]">{formatDate(item.createdAt)}</span>
        </div>
        <p className="text-sm text-[#1f2937]">
          {item.details?.description || 'No description available.'}
        </p>
      </SectionCard>

      <SectionCard title="Selected Symptoms" icon={ListChecks}>
        <ListBlock items={item.selectedSymptoms || []} emptyText="Symptoms not available." />
      </SectionCard>

      <SectionCard title="Top Predictions" icon={Activity}>
        {(item.topPredictions || []).length ? (
          <div className="space-y-2">
            {item.topPredictions.map((p, idx) => (
              <div
                key={`${p.disease}-${idx}`}
                className="rounded-lg bg-[#f8f9ff] border border-[#edf0ff] px-3 py-2 text-sm text-[#1f2937] flex justify-between"
              >
                <span>{p.disease || 'Unknown'}</span>
                <span className="font-semibold text-[#0b1030]">
                  {typeof p.confidence === 'number' ? `${Math.round(p.confidence * 100)}%` : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5f697a]">No top predictions available.</p>
        )}
      </SectionCard>

      <SectionCard title="Precautions" icon={Heart}>
        <ListBlock items={item.details?.precautions || []} emptyText="No precautions available." />
      </SectionCard>

      <SectionCard title="Medications" icon={Heart}>
        <ListBlock
          items={item.details?.medications || []}
          emptyText="No medication suggestions available."
        />
      </SectionCard>

      <SectionCard title="Diet Plan" icon={Heart}>
        <ListBlock items={item.details?.diets || []} emptyText="No diet suggestions available." />
      </SectionCard>

      <SectionCard title="Workout Plan" icon={Heart}>
        <ListBlock
          items={item.details?.workouts || []}
          emptyText="No workout suggestions available."
        />
      </SectionCard>

      <SectionCard title="Risk Factors" icon={Heart}>
        <ListBlock items={item.details?.riskFactors || []} emptyText="No risk factors available." />
      </SectionCard>
    </div>
  );
};

const PredictionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('heart');
  const [loading, setLoading] = useState(true);
  const [heartPredictions, setHeartPredictions] = useState([]);
  const [symptomPredictions, setSymptomPredictions] = useState([]);
  const [selectedHeart, setSelectedHeart] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    // Prefer the currently selected prediction of each type; fall back to latest (index 0)
    const heartPrediction = selectedHeart || heartPredictions[0] || null;
    const symptomsPrediction = selectedSymptom || symptomPredictions[0] || null;
    if (!heartPrediction && !symptomsPrediction) {
      toast({
        title: 'No data to report',
        description: 'Create a prediction first to generate a report.',
        variant: 'info',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { blob, filename } = await generatePdfBlob({
        heartPrediction,
        symptomsPrediction,
        user,
      });
      triggerDownload(blob, filename);
      toast({ title: 'Report downloaded', variant: 'success' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast({
        title: 'Could not generate report',
        description: 'Please try again in a moment.',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchAllHistory = async () => {
      setLoading(true);
      try {
        const [riskResponse, symptomResponse] = await Promise.all([
          riskService.getRiskHistory({ all: true }),
          riskService.getSymptomsPredictionHistory({ all: true }),
        ]);

        const riskItems = (riskResponse?.predictions || []).filter(
          (item) =>
            typeof item?.results?.heartDiseaseRisk === 'number' ||
            typeof item?.results?.diabetesRisk === 'number'
        );
        const symptomItems = symptomResponse?.predictions || [];

        setHeartPredictions(riskItems);
        setSymptomPredictions(symptomItems);
        setSelectedHeart(riskItems[0] || null);
        setSelectedSymptom(symptomItems[0] || null);
      } catch (error) {
        setHeartPredictions([]);
        setSymptomPredictions([]);
        setSelectedHeart(null);
        setSelectedSymptom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, []);

  const currentList = useMemo(
    () => (activeTab === 'heart' ? heartPredictions : symptomPredictions),
    [activeTab, heartPredictions, symptomPredictions]
  );

  const selectedId = activeTab === 'heart' ? selectedHeart?._id : selectedSymptom?._id;

  const handleSelect = (item) => {
    if (activeTab === 'heart') setSelectedHeart(item);
    else setSelectedSymptom(item);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="dash-card dash-card-accent" style={{ '--accent-stripe': '#506cd7' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <div className="dash-icon-badge dash-icon-badge--gradient-indigo hidden sm:inline-flex">
              <CalendarClock size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#0b1030]">
                <span className="dash-gradient-text">Prediction History</span>
              </h2>
              <p className="text-sm text-[#5f697a] mt-1">
                View all saved predictions and tap any record to see complete details. Generate a
                combined PDF covering both heart &amp; diabetes and symptoms analysis below.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGenerating || (!heartPredictions.length && !symptomPredictions.length)}
            className="flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <FileDown size={14} className="mr-2" /> Generate Complete Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="dash-card">
        <div className="flex p-0.5 bg-[#f0f1fc] rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('heart')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'heart'
                ? 'bg-white text-[#506cd7] shadow-sm'
                : 'text-[#5f697a] hover:text-[#0b1030]'
            }`}
          >
            <Heart
              size={14}
              className={activeTab === 'heart' ? 'text-rose-500' : 'text-[#6a7283]'}
            />
            Heart & Diabetes ({heartPredictions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('symptoms')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'symptoms'
                ? 'bg-white text-[#506cd7] shadow-sm'
                : 'text-[#5f697a] hover:text-[#0b1030]'
            }`}
          >
            <Brain
              size={14}
              className={activeTab === 'symptoms' ? 'text-indigo-500' : 'text-[#6a7283]'}
            />
            Symptoms Disease ({symptomPredictions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dash-card">
          <p className="text-sm text-[#5f697a]">Loading prediction history...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-1">
            <div className="dash-card h-auto">
              <h3 className="dash-heading text-sm sm:text-base mb-3">All Records</h3>
              <HistoryList
                items={currentList}
                selectedId={selectedId}
                onSelect={handleSelect}
                type={activeTab === 'heart' ? 'heart' : 'symptoms'}
              />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="dash-card h-full">
              <h3 className="dash-heading text-sm sm:text-base mb-3">Full Details</h3>
              {activeTab === 'heart' ? (
                <HeartDetail item={selectedHeart} />
              ) : (
                <SymptomsDetail item={selectedSymptom} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory;

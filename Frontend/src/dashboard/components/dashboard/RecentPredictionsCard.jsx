import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Heart, ChevronRight, History } from 'lucide-react';
import EmptyState from '../../../shared/ui/EmptyState';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'risk', label: 'Heart & Diabetes' },
];

const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

const dedupeSymptoms = (predictions) => {
  // Collapse consecutive entries with identical selectedSymptoms set
  const out = [];
  for (const p of predictions) {
    const key = [...(p.selectedSymptoms || [])].sort().join('|');
    const last = out[out.length - 1];
    if (last && last._dedupeKey === key) {
      last._count = (last._count || 1) + 1;
      continue;
    }
    out.push({ ...p, _dedupeKey: key, _count: 1 });
  }
  return out;
};

const RecentPredictionsCard = ({ symptomPredictions = [], riskPredictions = [] }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');

  const rows = useMemo(() => {
    const symptomRows = dedupeSymptoms(symptomPredictions).map((p) => ({
      id: p._id,
      kind: 'symptom',
      title: p.predictedDisease || 'Unknown condition',
      subtitle: (p.selectedSymptoms || []).slice(0, 3).join(', '),
      metric: typeof p.confidence === 'number' ? `${Math.round(p.confidence * 100)}%` : null,
      metricLabel: 'confidence',
      createdAt: p.createdAt,
      count: p._count,
    }));
    const riskRows = riskPredictions.map((p) => ({
      id: p._id,
      kind: 'risk',
      title: formatRiskLabel(p.results?.overallRisk),
      subtitle: p.results?.summary?.slice(0, 80) || 'Heart & diabetes risk analysis',
      metric: formatRiskMetric(p),
      metricLabel: 'risk',
      createdAt: p.createdAt,
    }));

    let combined;
    if (tab === 'symptoms') combined = symptomRows;
    else if (tab === 'risk') combined = riskRows;
    else combined = [...symptomRows, ...riskRows];

    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  }, [symptomPredictions, riskPredictions, tab]);

  const isEmpty = rows.length === 0;

  return (
    <div className="dash-card dash-card-accent" style={{ '--accent-stripe': '#e74c4c' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="dash-icon-badge dash-icon-badge--gradient-rose flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <History size={16} className="text-white" />
          </div>
          <h3 className="dash-heading text-sm sm:text-base">Recent Activity</h3>
        </div>

        <div className="flex p-0.5 bg-[#f0f1fc] rounded-xl self-stretch sm:self-auto overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none whitespace-nowrap px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-white text-[#506cd7] shadow-sm'
                  : 'text-[#6a7283] hover:text-[#0b1030]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Brain}
          title="No predictions yet"
          description="Run a symptoms check or a heart & diabetes risk assessment — results will stream in here."
          action={{
            label: 'Run your first check',
            onClick: () => navigate('/dashboard/risk-prediction'),
          }}
        />
      ) : (
        <div className="divide-y divide-[#f0f1fc]">
          {rows.map((row) => {
            const Icon = row.kind === 'risk' ? Heart : Brain;
            const iconClass =
              row.kind === 'risk'
                ? 'dash-icon-badge--gradient-rose'
                : 'dash-icon-badge--gradient-indigo';
            const targetPath =
              row.kind === 'risk'
                ? '/dashboard/risk-prediction/heart-diabetes'
                : '/dashboard/risk-prediction';

            return (
              <button
                key={`${row.kind}-${row.id}`}
                type="button"
                onClick={() => navigate(targetPath)}
                className="group w-full flex items-center gap-3 py-3 first:pt-0 last:pb-0 text-left hover:bg-slate-50/70 transition-colors -mx-2 px-2 rounded-lg"
              >
                <div className={`dash-icon-badge ${iconClass}`} style={{ width: 36, height: 36 }}>
                  <Icon size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0b1030] truncate">{row.title}</p>
                    {row.count > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0f1fc] text-[#506cd7] flex-shrink-0">
                        ×{row.count}
                      </span>
                    )}
                  </div>
                  {row.subtitle && (
                    <p className="text-[11px] text-[#6a7283] truncate mt-0.5">{row.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {row.metric && (
                    <span className="text-[11px] font-bold text-[#506cd7] bg-[#f0f1fc] px-2 py-1 rounded-full">
                      {row.metric}
                    </span>
                  )}
                  <span className="text-[11px] text-[#6a7283] hidden sm:inline">
                    {relativeTime(row.createdAt)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-[#94a3b8] group-hover:text-[#506cd7] transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatRiskLabel = (level) => {
  if (!level) return 'Risk assessment';
  const upper = level.charAt(0).toUpperCase() + level.slice(1);
  return `${upper} overall risk`;
};

const formatRiskMetric = (p) => {
  const h = p.results?.heartDiseaseRisk;
  const d = p.results?.diabetesRisk;
  if (typeof h === 'number' && typeof d === 'number') {
    return `H ${h}% · D ${d}%`;
  }
  if (typeof h === 'number') return `Heart ${h}%`;
  if (typeof d === 'number') return `Diabetes ${d}%`;
  return null;
};

export default RecentPredictionsCard;

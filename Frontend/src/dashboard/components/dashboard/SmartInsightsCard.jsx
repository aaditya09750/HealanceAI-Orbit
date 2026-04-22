import React, { useEffect, useState } from 'react';
import { Brain, Activity, Heart, Moon, Sparkles } from 'lucide-react';
import { dashboardService } from '../../../services/api';

const ICON_MAP = {
  activity: Activity,
  heart: Heart,
  brain: Brain,
  moon: Moon,
};

const SEVERITY_STYLES = {
  info: {
    bg: 'bg-blue-50',
    ring: 'ring-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  warn: {
    bg: 'bg-amber-50',
    ring: 'ring-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  critical: {
    bg: 'bg-rose-50',
    ring: 'ring-rose-100',
    iconBg: 'bg-rose-100 text-rose-600',
  },
};

const SmartInsightsCard = () => {
  const [insights, setInsights] = useState([]);
  const [source, setSource] = useState('rules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService
      .getInsights()
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setInsights(res.insights || []);
          setSource(res.source || 'rules');
        }
      })
      .catch(() => !cancelled && setInsights([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dash-card dash-card-accent" style={{ '--accent-stripe': '#506cd7' }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="dash-icon-badge dash-icon-badge--gradient-indigo">
            <Brain size={18} className="text-white" />
          </div>
          <h3 className="dash-heading text-sm sm:text-base">Smart Insights</h3>
        </div>
        <span className="dash-chip dash-chip--ai">
          <Sparkles size={10} />
          {source === 'llm' ? 'AI generated' : 'Personalized'}
        </span>
      </div>

      {loading && insights.length === 0 && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-[#f0f1fc]" />
          ))}
        </div>
      )}

      {!loading && insights.length === 0 && (
        <p className="text-sm text-[#6a7283] py-4">
          Log a walk, log water, or run a symptom check — your insights will start flowing in.
        </p>
      )}

      <div className="divide-y divide-[#f0f1fc]">
        {insights.map((insight, idx) => {
          const Icon = ICON_MAP[insight.icon] || Activity;
          const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
          return (
            <div key={idx} className={`py-3 first:pt-0 last:pb-0 ${idx === 0 ? '' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${style.iconBg} flex-shrink-0`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0b1030] leading-snug">{insight.title}</p>
                  <p className="text-xs text-[#5f697a] mt-1 leading-relaxed">{insight.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartInsightsCard;

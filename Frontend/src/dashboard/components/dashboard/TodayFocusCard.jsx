import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, Droplets, Footprints, Moon, Scale, Sparkles, Bell } from 'lucide-react';
import { useHealthData } from '../../../context/HealthDataContext';
import EmptyState from '../../../shared/ui/EmptyState';

const GOAL_STYLES = {
  water: {
    icon: Droplets,
    iconClass: 'dash-icon-badge--gradient-cyan',
    ringFrom: '#0ea5e9',
    ringTo: '#22d3ee',
  },
  steps: {
    icon: Footprints,
    iconClass: 'dash-icon-badge--gradient-amber',
    ringFrom: '#f59e0b',
    ringTo: '#fbbf24',
  },
  sleep: {
    icon: Moon,
    iconClass: 'dash-icon-badge--gradient-indigo',
    ringFrom: '#506cd7',
    ringTo: '#7c8bff',
  },
  weight: {
    icon: Scale,
    iconClass: 'dash-icon-badge--gradient-rose',
    ringFrom: '#e74c4c',
    ringTo: '#fb7185',
  },
  calories: {
    icon: Sparkles,
    iconClass: 'dash-icon-badge--gradient-violet',
    ringFrom: '#7c3aed',
    ringTo: '#a78bfa',
  },
  custom: {
    icon: Target,
    iconClass: 'dash-icon-badge--gradient-emerald',
    ringFrom: '#10b981',
    ringTo: '#34d399',
  },
};

const TodayFocusCard = () => {
  const navigate = useNavigate();
  const { activeGoals, updateGoalProgress } = useHealthData();

  const incompleteGoals = useMemo(() => {
    return (activeGoals || [])
      .filter((g) => !g.isCompleted)
      .sort((a, b) => {
        const aPct = a.target > 0 ? a.current / a.target : 0;
        const bPct = b.target > 0 ? b.current / b.target : 0;
        return aPct - bPct; // lowest completion first (needs focus most)
      })
      .slice(0, 5);
  }, [activeGoals]);

  const handleBump = async (goal) => {
    const step = goal.type === 'water' ? 0.25 : Math.max(1, Math.round(goal.target / 20));
    const newValue = Math.min(goal.current + step, goal.target);
    try {
      await updateGoalProgress(goal.type, newValue);
    } catch (err) {
      // silent — goals page handles error display
    }
  };

  return (
    <div
      className="dash-card dash-card-accent flex flex-col"
      style={{ '--accent-stripe': '#10b981' }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="dash-icon-badge dash-icon-badge--gradient-emerald">
            <Target size={18} className="text-white" />
          </div>
          <h3 className="dash-heading text-sm sm:text-base">Today's Focus</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/reverse-planner')}
          className="text-xs font-semibold text-[#506cd7] hover:text-[#4753bf]"
        >
          View all →
        </button>
      </div>

      {incompleteGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No active goals"
          description="Set a daily goal — water, steps, sleep — and track progress here."
          action={{
            label: 'Add your first goal',
            onClick: () => navigate('/dashboard/reverse-planner'),
          }}
        />
      ) : (
        <div className="flex-1 space-y-2">
          {incompleteGoals.map((goal) => {
            const style = GOAL_STYLES[goal.type] || GOAL_STYLES.custom;
            const Icon = style.icon;
            const pct =
              goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
            const reached = pct >= 100;

            return (
              <div
                key={goal._id}
                className="group flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-slate-50/70 transition-colors"
              >
                <div
                  className={`dash-icon-badge ${style.iconClass} flex-shrink-0`}
                  style={{ width: 32, height: 32 }}
                >
                  <Icon size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-[#0b1030] truncate">
                      {goal.title}
                    </p>
                    <span className="text-[10px] sm:text-[11px] text-[#6a7283] flex-shrink-0">
                      {formatNumber(goal.current)} / {formatNumber(goal.target)} {goal.unit}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#f0f1fc] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${style.ringFrom}, ${style.ringTo})`,
                      }}
                    />
                  </div>
                </div>
                {!reached && (
                  <button
                    type="button"
                    onClick={() => handleBump(goal)}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg bg-[#f0f1fc] hover:bg-[#e8eaf9] text-[#506cd7] transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Add progress to ${goal.title}`}
                  >
                    <Plus size={12} />
                  </button>
                )}
                {reached && (
                  <span className="flex-shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-[#f0f1fc] flex items-center gap-2 text-[11px] text-[#6a7283]">
        <Bell size={12} />
        <span>Medication reminders coming soon</span>
      </div>
    </div>
  );
};

const formatNumber = (n) => {
  if (typeof n !== 'number') return n;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  if (n % 1 !== 0) return n.toFixed(1);
  return n.toString();
};

export default TodayFocusCard;

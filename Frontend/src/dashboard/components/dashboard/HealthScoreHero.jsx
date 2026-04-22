import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Activity, Target, ArrowRight, Sparkles } from 'lucide-react';
import CircularGauge from '../../../shared/ui/CircularGauge';
import useCountUp from '../../../shared/ui/useCountUp';

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
};

/**
 * Hero card for the dashboard — animated composite Health Score on the left,
 * a three-stat strip in the middle, and a single Next Action CTA on the right.
 * Visually it sits on `.dash-card-hero` which provides the gradient + glow blobs.
 */
const HealthScoreHero = ({ summary, userName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const healthScore = summary?.healthScore ?? 0;
  const streakDays = summary?.streakDays ?? 0;
  const avgScore7d = summary?.avgScore7d ?? 0;
  const topGoal = summary?.topGoal;
  const nextAction = summary?.nextAction;

  const streakCount = useCountUp(streakDays, { duration: 900 });
  const avgCount = useCountUp(avgScore7d, { duration: 900 });
  const topGoalCount = useCountUp(topGoal?.pct ?? 0, { duration: 900 });

  const handleNextAction = () => {
    if (nextAction?.href) navigate(nextAction.href);
  };

  const firstName = (userName || '').split(' ')[0] || 'there';

  return (
    <div className="dash-card-hero">
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sm:gap-6 lg:gap-8">
        {/* Top on mobile: gauge + welcome text side by side */}
        <div className="flex items-center gap-4 lg:block lg:flex-shrink-0">
          <CircularGauge
            value={healthScore}
            size={isMobile ? 110 : 160}
            stroke={isMobile ? 10 : 14}
            label="Health Score"
          />
          {/* Welcome text shown next to gauge on mobile only */}
          <div className="flex-1 min-w-0 lg:hidden">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-[#506cd7]">
              Today · Snapshot
            </p>
            <h2 className="dash-heading text-base sm:text-xl mt-0.5 leading-tight">
              {healthScore >= 80
                ? `Thriving, ${firstName}`
                : healthScore >= 50
                  ? `Keep going, ${firstName}`
                  : `Let's build momentum`}
            </h2>
          </div>
        </div>

        {/* Middle — Three-stat strip (full width mobile, flex-1 desktop) */}
        <div className="flex-1 w-full min-w-0">
          {/* Welcome text on desktop only */}
          <div className="mb-3 hidden lg:block">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-[#506cd7]">
              Today · Snapshot
            </p>
            <h2 className="dash-heading text-xl sm:text-2xl mt-0.5">
              {healthScore >= 80
                ? `You're thriving, ${firstName}`
                : healthScore >= 50
                  ? `Keep going, ${firstName}`
                  : `Let's build momentum, ${firstName}`}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:max-w-md">
            <HeroStat
              icon={Flame}
              iconClass="dash-icon-badge--gradient-amber"
              label="Streak"
              value={streakCount}
              suffix={streakDays === 1 ? 'day' : 'days'}
            />
            <HeroStat
              icon={Activity}
              iconClass="dash-icon-badge--gradient-indigo"
              label="Avg 7d"
              value={avgCount}
              suffix=""
            />
            <HeroStat
              icon={Target}
              iconClass="dash-icon-badge--gradient-emerald"
              label={topGoal?.title ? truncate(topGoal.title, 8) : 'Top goal'}
              value={topGoalCount}
              suffix="%"
            />
          </div>
        </div>

        {/* Right — Next Action CTA (full-width on mobile, auto on desktop) */}
        {nextAction && (
          <button
            type="button"
            onClick={handleNextAction}
            disabled={!nextAction.href}
            className="group w-full lg:w-auto flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-md hover:shadow-lg transition-all disabled:cursor-default disabled:opacity-90"
            style={{ boxShadow: '0 10px 24px rgba(80, 108, 215, 0.18)' }}
          >
            <div className="dash-icon-badge dash-icon-badge--gradient-indigo flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6a7283]">
                Next Action
              </p>
              <p className="text-sm sm:text-base font-bold text-[#0b1030] flex items-center gap-1.5 truncate">
                <span className="truncate">{nextAction.label}</span>
                {nextAction.href && (
                  <ArrowRight
                    size={14}
                    className="text-[#506cd7] flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

const HeroStat = ({ icon: Icon, iconClass, label, value, suffix }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 border border-white/80 flex items-center gap-1.5 sm:gap-2 min-w-0">
    <div className={`dash-icon-badge ${iconClass} flex-shrink-0`} style={{ width: 28, height: 28 }}>
      <Icon size={12} className="text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-[#6a7283] truncate">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold text-[#0b1030] leading-tight">
        {Math.round(value)}
        {suffix && (
          <span className="text-[9px] sm:text-[10px] font-semibold text-[#6a7283] ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  </div>
);

const truncate = (str, max) => (str.length > max ? str.slice(0, max - 1) + '…' : str);

export default HealthScoreHero;

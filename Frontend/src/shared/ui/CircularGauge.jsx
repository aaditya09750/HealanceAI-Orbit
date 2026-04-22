import React, { useId } from 'react';
import { useCountUp } from './useCountUp';

/**
 * Circular progress gauge with animated stroke + count-up label.
 *
 * Props:
 *   value      0-100
 *   size       px — full svg size (default 160)
 *   stroke     px — ring thickness (default 12)
 *   from/to    gradient stops (defaults to indigo → cyan, Healance brand)
 *   label      optional sub-label (e.g. "Health Score")
 *   suffix     e.g. "%" — rendered small after the number
 */
const CircularGauge = ({
  value = 0,
  size = 160,
  stroke = 12,
  from = '#506cd7',
  to = '#0ea5e9',
  label,
  suffix,
  track = '#e8eaf9',
}) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const counted = useCountUp(safeValue, { duration: 1000 });
  const gradId = useId();

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (counted / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="dash-gradient-text font-heading font-bold"
          style={{ fontSize: size * 0.28, lineHeight: 1 }}
        >
          {Math.round(counted)}
          {suffix && (
            <span className="text-[0.45em] align-top ml-0.5 text-[#6a7283] font-semibold">
              {suffix}
            </span>
          )}
        </span>
        {label && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6a7283] mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularGauge;

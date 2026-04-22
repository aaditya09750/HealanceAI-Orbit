import React, { useId } from 'react';

/**
 * Compact SVG sparkline with gradient fill under the line.
 *
 * Props:
 *   data     number[] — any length, normalized to svg width
 *   width    default 80
 *   height   default 22
 *   from/to  gradient stops (defaults to amber for steps)
 */
const Sparkline = ({ data = [], width = 80, height = 22, from = '#f59e0b', to = '#fbbf24' }) => {
  const gradId = useId();

  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="#e8eaf9" strokeWidth={2} />
      </svg>
    );
  }

  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;

  return (
    <svg width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={from} stopOpacity={0.35} />
          <stop offset="100%" stopColor={to} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={from}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;

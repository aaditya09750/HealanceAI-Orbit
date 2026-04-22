import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { dashboardService } from '../../../services/api';

const RANGES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
];

const WeeklyTrendsChart = () => {
  const [range, setRange] = useState('7d');
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService
      .getTrends(range)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) setDays(res.days || []);
      })
      .catch(() => !cancelled && setDays([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const current = days[days.length - 1] || {};
  const latest = {
    healthScore: current.healthScore ?? 0,
    stepsPct: current.stepsPct ?? 0,
    waterPct: current.waterPct ?? 0,
  };

  return (
    <div className="dash-card-static">
      <div className="flex flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="dash-icon-badge dash-icon-badge--gradient-indigo flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="dash-heading text-sm sm:text-base truncate">Weekly Health Trends</h3>
            <p className="hidden sm:block text-[11px] text-[#6a7283]">
              Score composed of steps, water, and active goals
            </p>
          </div>
        </div>

        {/* Pill toggle */}
        <div className="flex p-0.5 bg-[#f0f1fc] rounded-xl flex-shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all ${
                range === r.id
                  ? 'bg-white text-[#506cd7] shadow-sm'
                  : 'text-[#6a7283] hover:text-[#0b1030]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <AreaChart data={days}>
            <defs>
              <linearGradient id="dashScoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#506cd7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashScoreStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#506cd7" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0' }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              stroke="url(#dashScoreStroke)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#dashScoreFill)"
              name="Health Score"
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="stepsPct"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              name="Steps %"
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="waterPct"
              stroke="#22d3ee"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name="Water %"
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend strip */}
      <div className="flex flex-wrap gap-3 mt-4">
        <LegendChip
          color="linear-gradient(135deg, #506cd7, #0ea5e9)"
          label="Health Score"
          value={latest.healthScore}
        />
        <LegendChip color="#f59e0b" label="Steps" value={latest.stepsPct} />
        <LegendChip color="#22d3ee" label="Water" value={latest.waterPct} dashed />
      </div>

      {loading && days.length === 0 && (
        <p className="text-xs text-[#6a7283] mt-2">Loading your trend data…</p>
      )}
      {!loading && days.length > 0 && days.every((d) => d.healthScore === 0) && (
        <p className="text-xs text-[#6a7283] mt-2">
          No activity logged in the last {range === '30d' ? '30' : '7'} days. Start a walk or log
          water to light this chart up.
        </p>
      )}
    </div>
  );
};

const LegendChip = ({ color, label, value, dashed }) => (
  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#f8f9ff] border border-[#e8eaf9]">
    <span
      className="inline-block rounded-full"
      style={{
        width: 10,
        height: 10,
        background: color.startsWith('linear-gradient') ? color : undefined,
        backgroundColor: color.startsWith('linear-gradient') ? undefined : color,
        border: dashed ? `1.5px dashed ${color}` : 'none',
        backgroundImage: dashed ? 'none' : undefined,
      }}
    />
    <span className="text-[11px] font-semibold text-[#0b1030]">{label}</span>
    <span className="text-[11px] text-[#6a7283]">{Math.round(value)}%</span>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div
      className="bg-white px-4 py-3 rounded-2xl border border-[#e8eaf9]"
      style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
    >
      <p className="text-xs font-bold text-[#0b1030] mb-1">{label}</p>
      <div className="space-y-1 text-xs">
        <p className="text-[#5f697a]">
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: 'linear-gradient(135deg, #506cd7, #0ea5e9)' }}
          />
          Score:{' '}
          <span className="font-bold text-[#0b1030]">{Math.round(row.healthScore || 0)}</span>
        </p>
        <p className="text-[#5f697a]">
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: '#f59e0b' }}
          />
          Steps: <span className="font-bold text-[#0b1030]">{Math.round(row.stepsPct || 0)}%</span>
        </p>
        <p className="text-[#5f697a]">
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: '#22d3ee' }}
          />
          Water: <span className="font-bold text-[#0b1030]">{Math.round(row.waterPct || 0)}%</span>
        </p>
      </div>
    </div>
  );
};

export default WeeklyTrendsChart;

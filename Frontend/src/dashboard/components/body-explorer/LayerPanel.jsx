import React, { useMemo, useState } from 'react';
import {
  Layers,
  Heart,
  Wind,
  Utensils,
  Brain,
  Dumbbell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { SYSTEM_META } from './bodyGeometry';

/**
 * System filter panel.
 * Replaces the old "Muscles / Bones / Organs / Systems" tint tabs with a
 * real, functional body-system filter:
 *   - Picking a system tints the model with that system's signature colour
 *   - Below the pills, a compact parts list shows the catalog entries that
 *     belong to the selected system — clicking one opens the PartDetailCard
 *     and glows the matching region on the canvas.
 *
 * The catalog comes from the page-level BodyExplorer via the `catalog` prop;
 * if the catalog is still loading we show a subtle placeholder.
 */

const ICON_MAP = {
  Layers,
  Heart,
  Wind,
  Utensils,
  Brain,
  Dumbbell,
};

const LayerPanel = ({
  activeSystem = 'all',
  onSystemChange,
  catalog = {},
  onPartSelect,
  catalogLoading = false,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = SYSTEM_META.find((s) => s.id === activeSystem) || SYSTEM_META[0];
  const ActiveIcon = ICON_MAP[activeItem.iconName] || Layers;

  // Parts list — filtered by the selected system (skipped when 'all').
  const partsInSystem = useMemo(() => {
    if (activeSystem === 'all') return [];
    return Object.entries(catalog)
      .filter(([, info]) => info?.system === activeSystem)
      .map(([name]) => name)
      .sort();
  }, [catalog, activeSystem]);

  return (
    <>
      {/* Desktop — fixed width so pills and parts list don't reflow when
          switching systems. 224 px comfortably fits the longest label
          ("Musculoskeletal") and the longest part name ("Small Intestine"). */}
      <div className="absolute top-3 left-3 z-20 hidden sm:flex flex-col gap-1.5 w-56">
        {SYSTEM_META.map((sys) => {
          const Icon = ICON_MAP[sys.iconName] || Layers;
          const isActive = activeSystem === sys.id;
          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => onSystemChange?.(sys.id)}
              aria-pressed={isActive}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-200 w-full text-left
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                ${
                  isActive
                    ? 'text-white shadow-lg scale-[1.02]'
                    : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                }
              `}
              style={
                isActive
                  ? {
                      backgroundColor: sys.accent,
                      boxShadow: `0 6px 18px ${hexToRgba(sys.accent, 0.35)}`,
                    }
                  : undefined
              }
            >
              <Icon size={14} />
              <span className="truncate">{sys.label}</span>
            </button>
          );
        })}

        {/* Parts-in-system list — visually anchored to the active pill via
            a coloured left-edge accent, zero-gap top border, and matching
            shadow. Reads as one continuous unit with the active pill. */}
        {activeSystem !== 'all' && (
          <div
            className="w-full rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/60 overflow-hidden"
            style={{
              boxShadow: '0 8px 20px rgba(2, 6, 23, 0.08)',
              borderLeft: `3px solid ${activeItem.accent}`,
              marginTop: -2,
            }}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                Parts in {activeItem.label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 rounded-full"
                style={{
                  color: activeItem.accent,
                  backgroundColor: hexToRgba(activeItem.accent, 0.12),
                }}
              >
                {partsInSystem.length}
              </span>
            </div>
            {/* Scrollable list — 5 items visible (~ 140px), scroll beyond */}
            <div className="max-h-[140px] overflow-y-auto scrollbar-hide">
              {catalogLoading && (
                <div className="px-3 py-2 text-[11px] text-slate-400 italic">Loading…</div>
              )}
              {!catalogLoading && partsInSystem.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                  No parts in this system yet.
                </div>
              )}
              {partsInSystem.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPartSelect?.(name)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[11px] text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50"
                >
                  <span className="truncate font-medium">{name}</span>
                  <ChevronRight size={11} className="text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile — compact dropdown */}
      <div className="absolute top-3 left-3 z-20 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-lg"
          style={{
            backgroundColor: activeItem.accent,
            boxShadow: `0 6px 18px ${hexToRgba(activeItem.accent, 0.35)}`,
          }}
        >
          <ActiveIcon size={14} />
          <span>{activeItem.label}</span>
          <ChevronDown
            size={12}
            className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMobileOpen(false)} />
            <div
              className="absolute top-full left-0 mt-1.5 z-20 flex flex-col gap-1 min-w-[180px]
                         bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-xl p-1.5"
            >
              {SYSTEM_META.filter((s) => s.id !== activeSystem).map((sys) => {
                const Icon = ICON_MAP[sys.iconName] || Layers;
                return (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => {
                      onSystemChange?.(sys.id);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Icon size={13} style={{ color: sys.accent }} />
                    <span>{sys.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Mobile parts list appears below the dropdown when a system is active */}
        {!mobileOpen && activeSystem !== 'all' && partsInSystem.length > 0 && (
          <div
            className="mt-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/60 overflow-hidden max-w-[220px]"
            style={{ boxShadow: '0 8px 20px rgba(2, 6, 23, 0.08)' }}
          >
            <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                Parts
              </span>
              <span className="text-[9px] font-bold text-slate-700">{partsInSystem.length}</span>
            </div>
            <div className="max-h-40 overflow-y-auto scrollbar-hide">
              {partsInSystem.slice(0, 8).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPartSelect?.(name)}
                  className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 text-left text-[10px] text-slate-700 hover:bg-slate-50"
                >
                  <span className="truncate font-medium">{name}</span>
                  <ChevronRight size={10} className="text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default LayerPanel;

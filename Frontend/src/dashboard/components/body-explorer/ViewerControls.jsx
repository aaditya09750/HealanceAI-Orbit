import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Tag } from 'lucide-react';

const ToolbarButton = ({ onClick, icon: Icon, label, active, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium
      transition-all duration-200 active:scale-95
      px-2 py-2 sm:px-3 sm:py-2
      ${
        active
          ? 'bg-red-600 text-white shadow-sm'
          : 'bg-white/90 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/60'
      }
      ${className}
    `}
    title={label}
  >
    <Icon size={14} />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const ViewerControls = ({ onResetCamera, onZoomIn, onZoomOut, showLabels, onToggleLabels }) => {
  const hasLabelToggle = typeof onToggleLabels === 'function';

  return (
    <div
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20
                    flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2
                    bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-lg"
    >
      {hasLabelToggle && (
        <>
          <ToolbarButton icon={Tag} label="Labels" onClick={onToggleLabels} active={showLabels} />
          <div className="w-px h-5 bg-slate-200 mx-0.5" />
        </>
      )}

      <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
      <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />

      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      <ToolbarButton icon={RotateCcw} label="Reset View" onClick={onResetCamera} />
    </div>
  );
};

export default ViewerControls;

import React from 'react';
import { Html } from '@react-three/drei';

const AnatomyLabels = ({
  showLabels = true,
  labelAnchors = [],
  hoveredRegion,
  selectedPart,
  onLabelClick,
}) => {
  if (!showLabels || labelAnchors.length === 0) return null;

  return (
    <>
      {labelAnchors.map(({ bodyPart, label, pos, side }) => {
        const isHovered = hoveredRegion === bodyPart;
        const isSelected = selectedPart === bodyPart;
        const offsetX = side === 'right' ? 80 : -80;

        return (
          <Html
            key={bodyPart}
            position={pos}
            center
            distanceFactor={3}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              transition: 'opacity 0.2s',
              opacity: isHovered || isSelected ? 1 : 0.7,
            }}
          >
            <div
              className="relative flex items-center cursor-pointer"
              style={{
                transform: `translateX(${offsetX}px)`,
                flexDirection: side === 'right' ? 'row' : 'row-reverse',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onLabelClick?.(bodyPart);
              }}
            >
              {/* Connector line */}
              <div
                className={`h-[1px] border-t border-dashed ${
                  isHovered || isSelected ? 'border-red-500' : 'border-slate-400'
                }`}
                style={{ width: `${Math.abs(offsetX) - 10}px` }}
              />

              {/* Dot at body end */}
              <div
                className={`absolute w-2 h-2 rounded-full ${
                  isHovered || isSelected ? 'bg-red-500' : 'bg-slate-400'
                }`}
                style={{
                  [side === 'right' ? 'left' : 'right']: '-4px',
                  top: '-3px',
                }}
              />

              {/* Label text */}
              <div
                className={`
                  px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap
                  transition-all duration-200
                  ${
                    isHovered || isSelected
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-white/95 text-slate-700 shadow-sm border border-slate-200/80'
                  }
                `}
              >
                {label}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
};

export default AnatomyLabels;

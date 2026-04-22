import React from 'react';
import { Svg, Defs, LinearGradient, Stop, Circle, Path, G } from '@react-pdf/renderer';

// Healance brand logo — replicates /public/favicon.svg using react-pdf's
// native Svg primitives (no external image asset needed). Accepts a `size`
// prop (in pt) and uses a unique gradient id so multiple instances on the
// same page don't collide.
const BrandLogo = ({ size = 20, idSuffix = 'default' }) => {
  const gradientId = `healanceGradient-${idSuffix}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00B4DB" stopOpacity={1} />
          <Stop offset="100%" stopColor="#0083B0" stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} />
      <G>
        {/* Heart shape (filled white) */}
        <Path
          fill="#ffffff"
          d="M50 75 L35 60 Q30 55 30 48 Q30 40 37 37 Q44 34 50 42 Q56 34 63 37 Q70 40 70 48 Q70 55 65 60 Z"
        />
        {/* Pulse line */}
        <Path
          d="M25 85 L30 85 L35 75 L40 95 L45 70 L50 85 L55 85"
          stroke="#ffffff"
          strokeWidth={2.5}
          fill="none"
        />
      </G>
    </Svg>
  );
};

export default BrandLogo;

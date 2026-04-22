import React from 'react';

const ShimmerBlock = ({ width = '100%', height = 20, radius = 8 }) => (
  <div
    className="animate-pulse"
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: `${height}px`,
      borderRadius: `${radius}px`,
      backgroundColor: '#eef1ff',
    }}
  />
);

export const SkeletonCard = () => (
  <div className="dash-card-static">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <ShimmerBlock width="60%" height={14} />
        <div className="mt-2">
          <ShimmerBlock width="40%" height={28} />
        </div>
      </div>
      <ShimmerBlock width={44} height={44} radius={999} />
    </div>
    <ShimmerBlock width="50%" height={12} radius={6} />
  </div>
);

export const SkeletonChart = () => (
  <div className="dash-card-static lg:col-span-2">
    <div className="flex justify-between items-center mb-6">
      <ShimmerBlock width="40%" height={18} />
      <ShimmerBlock width={120} height={32} />
    </div>
    <ShimmerBlock width="100%" height={240} radius={12} />
  </div>
);

export const SkeletonSchedule = () => (
  <div className="dash-card-static">
    <div className="flex items-center gap-2 mb-6">
      <ShimmerBlock width={44} height={44} radius={999} />
      <ShimmerBlock width="50%" height={18} />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <ShimmerBlock width={48} height={36} />
          <div className="flex-1">
            <ShimmerBlock width="100%" height={56} radius={12} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonRiskCard = () => (
  <div className="dash-card-static">
    <div className="flex items-center gap-2 mb-6">
      <ShimmerBlock width={44} height={44} radius={999} />
      <ShimmerBlock width="60%" height={18} />
    </div>
    <div className="space-y-4">
      <ShimmerBlock width="100%" height={44} radius={12} />
      <ShimmerBlock width="100%" height={44} radius={12} />
      <ShimmerBlock width="80%" height={14} radius={6} />
    </div>
  </div>
);

export const SkeletonHero = () => (
  <div className="dash-card-hero">
    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
      <ShimmerBlock width={160} height={160} radius={999} />
      <div className="flex-1 w-full space-y-3">
        <ShimmerBlock width="40%" height={14} />
        <ShimmerBlock width="60%" height={28} />
        <div className="flex gap-3 mt-2">
          <ShimmerBlock width={90} height={46} radius={14} />
          <ShimmerBlock width={90} height={46} radius={14} />
          <ShimmerBlock width={90} height={46} radius={14} />
        </div>
      </div>
      <ShimmerBlock width={160} height={54} radius={16} />
    </div>
  </div>
);

export const SkeletonQuickActions = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="dash-card-static flex items-center gap-3 py-4">
        <ShimmerBlock width={44} height={44} radius={999} />
        <div className="flex-1">
          <ShimmerBlock width="60%" height={14} />
          <div className="mt-2">
            <ShimmerBlock width="40%" height={12} radius={6} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonForm = () => (
  <div className="dash-card-static">
    <ShimmerBlock width="50%" height={24} />
    <div className="mt-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <ShimmerBlock width="30%" height={14} radius={6} />
          <div className="mt-2">
            <ShimmerBlock width="100%" height={42} radius={14} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

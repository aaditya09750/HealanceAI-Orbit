import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white z-10">
      <div className="relative">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <div className="absolute inset-0 w-10 h-10 rounded-full bg-red-500/10 animate-ping" />
      </div>
      <p className="text-sm text-slate-500 font-medium mt-4">Loading 3D Model...</p>
      <div className="w-40 h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );
};

export default LoadingOverlay;

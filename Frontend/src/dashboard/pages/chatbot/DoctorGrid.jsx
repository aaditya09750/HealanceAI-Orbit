import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, ShieldAlert, SortAsc } from 'lucide-react';
import DoctorCard from './DoctorCard';

/**
 * Grid wrapper for nearby-doctor results. Matches the chat-bubble card
 * style: outer dash-card-static with a header describing the search and
 * then a stack of DoctorCard components.
 *
 * `payload` matches the /api/chatbot/nearby-doctors response:
 *   { status, location, specialty, doctors[], sources, disclaimer, message? }
 */
const DoctorGrid = ({ payload }) => {
  const [sortMode, setSortMode] = useState('distance'); // 'distance' | 'rating'

  const { status, location, specialty, doctors = [], disclaimer, message } = payload || {};

  const sorted = useMemo(() => {
    const arr = Array.isArray(doctors) ? [...doctors] : [];
    if (sortMode === 'rating') {
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      arr.sort((a, b) => {
        const da = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
        const db = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return arr;
  }, [doctors, sortMode]);

  // Non-OK or empty states
  if (!payload || status !== 'ok') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="dash-card-static border-l-4 border-amber-400"
      >
        <div className="flex items-start gap-3">
          <div className="dash-icon-badge bg-amber-400 flex-shrink-0">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-[#0b1030] text-sm">
              Couldn't search for nearby doctors
            </h4>
            <p className="text-sm text-[#5f697a] mt-1">
              {message || 'Please try again, or enter a different city.'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="dash-card-static border-l-4 border-[#506cd7]"
      >
        <div className="flex items-start gap-3">
          <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-[#0b1030] text-sm">
              No {specialty || 'doctors'} found near {location?.name || 'you'}
            </h4>
            <p className="text-sm text-[#5f697a] mt-1">
              Try expanding the search area, or try a larger nearby city.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="dash-card-static"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
            <Users size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-heading font-bold text-[#0b1030] text-base capitalize truncate">
              {specialty || 'Doctor'}s near you
            </h4>
            <p className="text-[11px] text-[#6a7283] mt-0.5 flex items-center gap-1">
              <MapPin size={11} className="text-[#506cd7]" />
              {location?.name || 'your location'} · {sorted.length} result
              {sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {sorted.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <SortAsc size={13} className="text-[#6a7283]" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="text-[11px] font-semibold bg-[#f0f1fc] text-[#506cd7] rounded-md px-2 py-1 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#506cd7]/30"
            >
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map((doc) => (
          <DoctorCard key={doc._id || `${doc.name}-${doc.distanceKm}`} doctor={doc} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-[#e8eaf9] flex items-start gap-2">
        <ShieldAlert size={12} className="text-[#6a7283] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[#6a7283] leading-snug italic">
          {disclaimer ||
            'Results combine curated partner doctors with public OpenStreetMap data. Please verify details with the practice before booking.'}
        </p>
      </div>
    </motion.div>
  );
};

export default DoctorGrid;

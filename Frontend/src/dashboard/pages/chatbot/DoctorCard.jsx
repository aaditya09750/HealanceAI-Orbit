import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Phone, Map, Calendar, Star, ShieldCheck, Globe } from 'lucide-react';

// Generate a simple coloured initials avatar when no photo is available
const InitialsAvatar = ({ name = '' }) => {
  const initials = name
    .replace(/dr\.?/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#506cd7] to-[#4753bf] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {initials || '?'}
    </div>
  );
};

const formatDistance = (km) => {
  if (typeof km !== 'number' || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const capitalise = (s) => (typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const DoctorCard = ({ doctor }) => {
  if (!doctor || !doctor.name) return null;

  const {
    name,
    specialty,
    clinicName,
    qualifications,
    experienceYears,
    rating,
    reviewCount,
    photo,
    address = {},
    phone,
    website,
    distanceKm,
    googleMapUrl,
    verified,
    source,
  } = doctor;

  const addressLine = [address.line1, address.city, address.state].filter(Boolean).join(', ');

  const hasPhoto = !!photo && photo.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="dash-card-static"
    >
      <div className="flex items-start gap-3">
        {hasPhoto ? (
          <img
            src={photo}
            alt={name}
            onError={(e) => {
              // Hide the broken image so the initials avatar takes over next render
              e.currentTarget.style.display = 'none';
            }}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <InitialsAvatar name={name} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <h4 className="font-heading font-bold text-[#0b1030] text-sm leading-tight truncate">
              {name}
            </h4>
            {verified && (
              <span title="Verified partner">
                <ShieldCheck size={13} className="text-[#10b981]" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <Stethoscope size={11} className="text-[#506cd7] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-[#506cd7] capitalize">
              {capitalise(specialty || 'Doctor')}
            </span>
            {typeof rating === 'number' && rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-[#5f697a] ml-1">
                <Star size={11} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-[#0b1030]">{rating.toFixed(1)}</span>
                {typeof reviewCount === 'number' && reviewCount > 0 && (
                  <span className="text-[#6a7283]">({reviewCount})</span>
                )}
              </span>
            )}
            {typeof distanceKm === 'number' && (
              <span className="text-[11px] text-[#6a7283] ml-1">
                · {formatDistance(distanceKm)}
              </span>
            )}
          </div>

          {qualifications && (
            <p className="text-[11px] text-[#5f697a] mt-1 truncate">
              {qualifications}
              {typeof experienceYears === 'number' && experienceYears > 0 && (
                <> · {experienceYears} yrs exp.</>
              )}
            </p>
          )}

          {(clinicName || addressLine) && (
            <p className="text-[11px] text-[#6a7283] mt-1 line-clamp-2">
              {clinicName && <strong className="text-[#0b1030] not-italic">{clinicName}</strong>}
              {clinicName && addressLine && ' · '}
              {addressLine}
            </p>
          )}

          {source === 'osm' && (
            <p className="text-[10px] text-[#6a7283] mt-1 italic">
              Listed from OpenStreetMap — please verify details with the clinic
            </p>
          )}
        </div>
      </div>

      {/* Action buttons row */}
      <div className="mt-3 pt-3 border-t border-[#e8eaf9] flex items-center gap-2">
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[#f0f1fc] text-[#506cd7] hover:bg-[#e8eaf9] transition-colors"
            aria-label={`Call ${name}`}
          >
            <Phone size={13} /> Call
          </a>
        ) : (
          <span className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[#f3f3ff] text-[#9aa3b2]">
            <Phone size={13} /> No phone
          </span>
        )}
        {googleMapUrl ? (
          <a
            href={googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[#f0f1fc] text-[#506cd7] hover:bg-[#e8eaf9] transition-colors"
            aria-label={`Open ${name} in Google Maps`}
          >
            <Map size={13} /> Map
          </a>
        ) : null}
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[#f0f1fc] text-[#506cd7] hover:bg-[#e8eaf9] transition-colors"
            aria-label={`Open website for ${name}`}
          >
            <Globe size={13} /> Website
          </a>
        ) : (
          <a
            href={`/book-appointment?doctor=${encodeURIComponent(name)}`}
            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:opacity-95 transition-opacity"
            aria-label={`Book appointment with ${name}`}
          >
            <Calendar size={13} /> Book
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default DoctorCard;

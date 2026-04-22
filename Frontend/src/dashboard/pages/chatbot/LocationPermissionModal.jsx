import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Send, X, Navigation } from 'lucide-react';
import Button from '../../../shared/ui/Button';

/**
 * Branded permission modal. Asks for browser geolocation with a friendly
 * explanation; if the user denies OR opts out, they can enter a city name
 * instead. Result is passed to `onResolved({ lat, lon, city })`.
 */
const LocationPermissionModal = ({
  isOpen,
  onClose,
  onResolved, // called with { lat, lon } OR { city }
  specialtyLabel = 'specialists',
}) => {
  const [mode, setMode] = useState('ask'); // 'ask' | 'requesting' | 'manual'
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const cancelRef = useRef(null);

  // Reset state when re-opened
  useEffect(() => {
    if (isOpen) {
      setMode('ask');
      setCity('');
      setError('');
      // Autofocus the cancel/close button so Esc works nicely
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const requestGeoloc = () => {
    if (!navigator.geolocation) {
      setMode('manual');
      setError('Your browser does not support geolocation. Please enter a city.');
      return;
    }
    setMode('requesting');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onResolved({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (err) => {
        setMode('manual');
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. You can enter a city instead.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Unable to determine your location. Please enter a city.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Please enter a city.');
        } else {
          setError('Could not get your location. Please enter a city.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const submitCity = () => {
    const trimmed = city.trim();
    if (trimmed.length < 2) {
      setError('Please enter a valid city name.');
      return;
    }
    onResolved({ city: trimmed });
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-[20px] w-full max-w-md p-5 sm:p-6"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="loc-title" className="text-base font-heading font-bold text-[#0b1030]">
              Find nearby {specialtyLabel}
            </h3>
            <p className="text-sm text-[#5f697a] mt-0.5">
              We'll use your location to show doctors and clinics close to you. Your location is
              never stored.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-[#f0f1fc] flex-shrink-0"
          >
            <X size={18} className="text-[#5f697a]" />
          </button>
        </div>

        {/* Ask mode */}
        {mode === 'ask' && (
          <div className="space-y-3">
            <Button onClick={requestGeoloc} className="w-full">
              <Navigation size={16} className="mr-2" /> Use my current location
            </Button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="w-full text-center text-sm font-semibold text-[#506cd7] hover:text-[#4753bf] py-2"
            >
              Or enter a city manually
            </button>
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs text-[#6a7283] hover:text-[#0b1030] py-1"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Requesting mode */}
        {mode === 'requesting' && (
          <div className="flex flex-col items-center py-4">
            <Loader2 size={28} className="animate-spin text-[#506cd7] mb-3" />
            <p className="text-sm text-[#5f697a]">
              Waiting for your browser to share your location…
            </p>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="mt-4 text-xs font-semibold text-[#506cd7] hover:text-[#4753bf]"
            >
              Skip, enter a city instead
            </button>
          </div>
        )}

        {/* Manual mode */}
        {mode === 'manual' && (
          <div className="space-y-3">
            {error && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="loc-city" className="block text-sm font-medium text-[#0b1030] mb-1.5">
                City
              </label>
              <input
                id="loc-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCity()}
                placeholder="e.g. Mumbai, Delhi, Bengaluru"
                autoFocus
                className="dash-input"
              />
              <p className="text-[11px] text-[#6a7283] mt-1">
                Works worldwide via OpenStreetMap. Indian metros have best coverage.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode('ask')} className="flex-1">
                Back
              </Button>
              <Button onClick={submitCity} className="flex-1" disabled={city.trim().length < 2}>
                <Send size={16} className="mr-2" /> Search
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LocationPermissionModal;

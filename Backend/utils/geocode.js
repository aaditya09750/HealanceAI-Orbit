/**
 * Free geocoding via Open-Meteo (already used by forecastController).
 *
 * Accepts either explicit lat/lon (returns as-is) or a city name and
 * resolves it to coordinates. Common Indian cities resolve from a local
 * dictionary to avoid unnecessary network calls.
 */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 5000;

const QUICK_CITIES = {
  mumbai: { lat: 19.076, lon: 72.8777, name: 'Mumbai' },
  bombay: { lat: 19.076, lon: 72.8777, name: 'Mumbai' },
  delhi: { lat: 28.6139, lon: 77.209, name: 'Delhi' },
  'new delhi': { lat: 28.6139, lon: 77.209, name: 'New Delhi' },
  ncr: { lat: 28.6139, lon: 77.209, name: 'Delhi NCR' },
  gurgaon: { lat: 28.4595, lon: 77.0266, name: 'Gurugram' },
  gurugram: { lat: 28.4595, lon: 77.0266, name: 'Gurugram' },
  noida: { lat: 28.5355, lon: 77.391, name: 'Noida' },
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  hyderabad: { lat: 17.385, lon: 78.4867, name: 'Hyderabad' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  calcutta: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  lucknow: { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  kochi: { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
};

/**
 * Resolve a location to { lat, lon, name }. Returns null if unable.
 */
export async function resolveLocation({ lat, lon, city } = {}) {
  const parsedLat = typeof lat === 'number' ? lat : Number(lat);
  const parsedLon = typeof lon === 'number' ? lon : Number(lon);

  if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
    return { lat: parsedLat, lon: parsedLon, name: city || 'Your Location' };
  }

  const rawCity = typeof city === 'string' ? city.trim() : '';
  if (!rawCity) return null;

  const quick = QUICK_CITIES[rawCity.toLowerCase()];
  if (quick) return { ...quick };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${GEOCODE_URL}?name=${encodeURIComponent(rawCity)}&count=1&language=en&format=json`,
      { signal: ctrl.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.results?.[0];
    if (!match) return null;
    return {
      lat: match.latitude,
      lon: match.longitude,
      name: [match.name, match.admin1, match.country].filter(Boolean).join(', ') || match.name,
    };
  } catch (err) {
    console.warn('[geocode] fetch failed:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

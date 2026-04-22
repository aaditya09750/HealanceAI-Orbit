/**
 * OpenStreetMap Overpass API — free, worldwide, no key required.
 *
 * We use it as a fallback for locations where our curated Doctor DB
 * doesn't have enough entries (e.g. smaller cities). OSM returns real
 * hospitals / clinics / doctor practices tagged by the community. The
 * data quality varies by region — cities typically have good coverage.
 *
 * Etiquette:
 *  - Max 1 req/sec from a single IP
 *  - Set a descriptive User-Agent
 *  - Cache aggressively (we cache 1 hour per grid cell)
 *
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'HealanceAI/1.0 (health-assistant)';
const TIMEOUT_MS = 10000;

// Simple in-memory cache keyed by (lat grid, lon grid, radius, specialty)
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function gridKey(lat, lon, radius, keyword) {
  // Round coordinates to ~1km grid so cache hits across nearby queries
  const gLat = Math.round(lat * 100) / 100;
  const gLon = Math.round(lon * 100) / 100;
  return `${gLat}:${gLon}:${radius}:${keyword || 'any'}`;
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
}

/**
 * Build an Overpass QL query looking for healthcare facilities near a point.
 * - `amenity=hospital|clinic|doctors|pharmacy`
 * - `healthcare=*` (which covers more specific tags)
 */
function buildQuery(lat, lon, radiusMeters, keyword) {
  const around = `around:${radiusMeters},${lat},${lon}`;
  // If a keyword is provided (e.g. "cardiology"), bias by name or healthcare:speciality tag
  const keywordFilter = keyword ? `["healthcare:speciality"~"${keyword}",i]` : '';
  const nameFilter = keyword ? `[name~"${keyword}",i]` : '';

  // Overpass QL — union of nodes/ways/relations with matching tags
  return `[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|doctors"](${around});
  node["healthcare"~"hospital|clinic|doctor|centre"](${around});
  ${keyword ? `node["healthcare"]${keywordFilter}(${around});` : ''}
  ${keyword ? `node["amenity"~"hospital|clinic|doctors"]${nameFilter}(${around});` : ''}
);
out center 30;`;
}

/**
 * Haversine distance in km between two [lat, lon] points.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find healthcare facilities near a lat/lon via OSM Overpass.
 * Returns an array of normalized "doctor-like" objects compatible with
 * the DoctorCard frontend. If the API fails, returns [].
 *
 * @param {object} opts
 * @param {number} opts.lat
 * @param {number} opts.lon
 * @param {number} [opts.radius=5000]  radius in meters (default 5km)
 * @param {string} [opts.keyword]      optional specialty hint, e.g. "cardiology"
 * @param {number} [opts.limit=8]
 */
export async function findNearbyHealthcare({ lat, lon, radius = 5000, keyword, limit = 8 }) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return [];

  const key = gridKey(lat, lon, radius, keyword);
  const cached = cacheGet(key);
  if (cached) return cached.slice(0, limit);

  const query = buildQuery(lat, lon, radius, keyword);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let data = null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn('[osm] non-200:', res.status);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.warn('[osm] fetch failed:', err.message);
    return [];
  } finally {
    clearTimeout(timer);
  }

  const elements = Array.isArray(data?.elements) ? data.elements : [];

  // Normalize to a doctor-card-shaped object
  const normalized = elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (typeof elLat !== 'number' || typeof elLon !== 'number') return null;
      const name = el.tags?.name || el.tags?.['name:en'] || null;
      if (!name) return null; // skip unnamed nodes — not useful to the user
      const amenity = el.tags?.amenity || el.tags?.healthcare || 'clinic';
      const speciality = el.tags?.['healthcare:speciality'] || null;
      const address = [
        el.tags?.['addr:housenumber'],
        el.tags?.['addr:street'],
        el.tags?.['addr:suburb'] || el.tags?.['addr:city'],
      ]
        .filter(Boolean)
        .join(', ');
      const phone =
        el.tags?.['contact:phone'] || el.tags?.phone || el.tags?.['contact:mobile'] || '';
      const website = el.tags?.['contact:website'] || el.tags?.website || '';
      const distanceKm = haversineKm(lat, lon, elLat, elLon);

      return {
        _id: `osm-${el.type}-${el.id}`,
        name,
        specialty: speciality || amenity, // fallback to facility type
        clinicName: amenity === 'hospital' ? name : amenity,
        qualifications: '',
        experienceYears: null,
        rating: null,
        reviewCount: null,
        photo: '',
        address: { line1: address, city: '', state: '', country: '', pincode: '' },
        location: { type: 'Point', coordinates: [elLon, elLat] },
        phone,
        email: '',
        website,
        acceptsNewPatients: null,
        verified: false,
        source: 'osm',
        distanceKm: Number(distanceKm.toFixed(2)),
        mapUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${elLat},${elLon}`,
      };
    })
    .filter(Boolean);

  // Sort nearest first, dedupe by name (OSM often has dup nodes)
  const seen = new Set();
  const unique = normalized
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((el) => {
      const k = el.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  cacheSet(key, unique);
  return unique.slice(0, limit);
}

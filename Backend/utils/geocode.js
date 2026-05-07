/**
 * Free geocoding via Open-Meteo (already used by forecastController).
 *
 * Accepts either explicit lat/lon (returns as-is or snapped to nearest metro)
 * or a city name and resolves it to coordinates. Common Indian cities and
 * their satellite suburbs resolve from a local alias map to avoid network
 * calls and to ensure suburb queries (e.g. "Dombivali") snap to the parent
 * metro for doctor lookup.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 5000;
const METRO_SNAP_RADIUS_M = 50_000; // GPS within 50 km of a metro snaps to it

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALIASES_PATH = resolve(__dirname, '../data/cityAliases.json');

let aliasData = { metros: {}, aliases: {} };
try {
  aliasData = JSON.parse(readFileSync(ALIASES_PATH, 'utf-8'));
} catch (err) {
  console.warn('[geocode] failed to load cityAliases.json:', err.message);
}

const METROS = aliasData.metros || {};
const ALIASES = aliasData.aliases || {};

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find the nearest metro to a given lat/lon. Returns { key, ...metro } if
 * within `withinM` meters, else null.
 */
function findNearestMetro(lat, lon, withinM = METRO_SNAP_RADIUS_M) {
  let best = null;
  let bestD = Infinity;
  for (const [key, m] of Object.entries(METROS)) {
    const d = haversineMeters(lat, lon, m.lat, m.lon);
    if (d < bestD) {
      bestD = d;
      best = { key, ...m, distanceM: d };
    }
  }
  if (best && best.distanceM <= withinM) return best;
  return null;
}

/**
 * Resolve a city name (or its alias) to a metro entry from the local map.
 * Returns { lat, lon, name, metroKey, aliasedFrom? } or null.
 */
function resolveFromAliasMap(rawCity) {
  if (!rawCity) return null;
  const key = rawCity.trim().toLowerCase();
  if (!key) return null;

  // Direct metro hit
  if (METROS[key]) {
    return { ...METROS[key], metroKey: key };
  }
  // Alias hit → look up the underlying metro
  const aliasTarget = ALIASES[key];
  if (aliasTarget && METROS[aliasTarget]) {
    return {
      ...METROS[aliasTarget],
      metroKey: aliasTarget,
      aliasedFrom: rawCity.trim(),
    };
  }
  return null;
}

/**
 * Resolve a location to { lat, lon, name, metroKey?, aliasedFrom? }.
 * Returns null if unable to resolve at all.
 */
export async function resolveLocation({ lat, lon, city } = {}) {
  const parsedLat = typeof lat === 'number' ? lat : Number(lat);
  const parsedLon = typeof lon === 'number' ? lon : Number(lon);

  // GPS path: snap to nearest metro within 50km, otherwise pass through.
  if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
    const snapped = findNearestMetro(parsedLat, parsedLon);
    if (snapped) {
      return {
        lat: snapped.lat,
        lon: snapped.lon,
        name: snapped.name,
        metroKey: snapped.key,
        aliasedFrom: city ? String(city).trim() : 'GPS',
        gpsLat: parsedLat,
        gpsLon: parsedLon,
      };
    }
    return { lat: parsedLat, lon: parsedLon, name: city || 'Your Location' };
  }

  const rawCity = typeof city === 'string' ? city.trim() : '';
  if (!rawCity) return null;

  // Local alias map — direct metro or known suburb
  const aliased = resolveFromAliasMap(rawCity);
  if (aliased) return aliased;

  // Fallback: Open-Meteo geocoding
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

    // After Open-Meteo gives us coords, try snapping to a metro if close.
    const snapped = findNearestMetro(match.latitude, match.longitude);
    if (snapped) {
      return {
        lat: snapped.lat,
        lon: snapped.lon,
        name: snapped.name,
        metroKey: snapped.key,
        aliasedFrom: rawCity,
      };
    }
    return {
      lat: match.latitude,
      lon: match.longitude,
      name:
        [match.name, match.admin1, match.country].filter(Boolean).join(', ') || match.name,
    };
  } catch (err) {
    console.warn('[geocode] fetch failed:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { METROS, ALIASES, findNearestMetro };

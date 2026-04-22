import * as THREE from 'three';

// ─── LAYER COLOR PALETTES ────────────────────────────────────
// Each layer has per-region colors for realistic medical visualization

// Each palette keeps clear identity per layer (muscles ≠ bones ≠ organs ≠ systems)
// but tightens intra-layer variation so the spatial-bbox classifier in
// regionDetector.js cannot produce visible patches when a mesh falls near a
// region boundary. Adjacent regions within a single layer now differ by
// ≲ 10 RGB units, so any misclassification is imperceptible.
// `fallback` is used for any mesh the classifier could not assign.
export const LAYER_PALETTES = {
  muscles: {
    // Warm pink-red flesh, all within a very narrow band.
    Brain: { base: '#D47E6E', accent: '#C46E5E' }, // Head — slightly lighter
    Heart: { base: '#CE7068', accent: '#BE6058' }, // Chest
    Lungs: { base: '#D07068', accent: '#C06058' }, // Ribcage (the baseline tone)
    Shoulders: { base: '#CE7068', accent: '#BE6058' }, // Deltoid
    Hands: { base: '#D27870', accent: '#C26860' }, // Arms
    Legs: { base: '#CE7068', accent: '#BE6058' }, // Quads
    Feet: { base: '#D07870', accent: '#C06860' }, // Feet
    fallback: '#D07068',
    roughness: 0.82,
    metalness: 0.02,
    opacity: 1.0,
  },
  bones: {
    // Near-uniform ivory; reads clearly as skeleton at a glance.
    Brain: { base: '#F6EFE0', accent: '#E7D9C1' },
    Heart: { base: '#F4EDDE', accent: '#E5D7BE' },
    Lungs: { base: '#F4EDDE', accent: '#E5D7BE' },
    Shoulders: { base: '#F5EEDF', accent: '#E6D8BF' },
    Hands: { base: '#F6EFE0', accent: '#E7D9C0' },
    Legs: { base: '#F4EDDE', accent: '#E5D7BE' },
    Feet: { base: '#F5EEDF', accent: '#E6D8BF' },
    fallback: '#F4EDDE',
    roughness: 0.55,
    metalness: 0.1,
    opacity: 1.0,
  },
  organs: {
    // Deeper, cohesive pink-red. Heart is barely darker than its neighbours now.
    Brain: { base: '#D06C78', accent: '#C05C68' },
    Heart: { base: '#CA5C60', accent: '#BA4C50' },
    Lungs: { base: '#CE6060', accent: '#BE5050' },
    Shoulders: { base: '#CC6060', accent: '#BC5050' },
    Hands: { base: '#CE6466', accent: '#BE5456' },
    Legs: { base: '#CC6466', accent: '#BC5456' },
    Feet: { base: '#CE6868', accent: '#BE5858' },
    fallback: '#CE6060',
    roughness: 0.55,
    metalness: 0.0,
    opacity: 0.88, // was 0.82 — less z-fighting on overlapping interior geometry
  },
  systems: {
    // Intentionally vivid, system-coded tints — reads as an anatomy diagram.
    // Kept distinct per-system; the anti-seam work now comes from Fixes 1 + 3 + 4
    // (no random lerp, correct transparency, catalog fallback).
    Brain: { base: '#4B9FE0', accent: '#2E7FC4' }, // Nervous
    Heart: { base: '#E74C4C', accent: '#C42828' }, // Circulatory
    Lungs: { base: '#46B890', accent: '#2A976E' }, // Respiratory
    Shoulders: { base: '#A268D0', accent: '#824AB0' }, // Lymphatic
    Hands: { base: '#4B9FE0', accent: '#2E7FC4' }, // Nervous
    Legs: { base: '#E74C4C', accent: '#C42828' }, // Circulatory
    Feet: { base: '#4B9FE0', accent: '#2E7FC4' }, // Nervous
    fallback: '#4B9FE0',
    roughness: 0.45,
    metalness: 0.15,
    opacity: 0.94,
  },
};

// Material defaults
export const MATERIAL_CONFIG = {
  roughness: 0.82,
  metalness: 0.02,
  envMapIntensity: 0.2,
};

// Per-system palettes — intentionally neutral across systems.
// Industry-standard anatomy viewers (Complete Anatomy, BioDigital Human,
// Visible Body) keep the body recognisable and neutral; system filtering
// EMPHASISES relevant regions rather than tinting the whole body a single
// colour. Flooding the whole figure red for Cardiovascular feels like a
// warning banner, not a filter. Instead we:
//   - Keep every system's body colour at the same warm neutral tone
//   - Opacity = 1.0 everywhere (no z-fighting / no patchy transparency)
//   - Move the signature system accent to emissive glow via SYSTEM_ACCENTS
//     applied in AnatomyModel.jsx to the mesh regions that belong to the
//     active system.
const NEUTRAL_BASE = {
  base: '#D07068',
  fallback: '#D07068',
  roughness: 0.8,
  metalness: 0.04,
  opacity: 1.0,
};

export const SYSTEM_PALETTES = {
  all: NEUTRAL_BASE,
  cardiovascular: NEUTRAL_BASE,
  respiratory: NEUTRAL_BASE,
  digestive: NEUTRAL_BASE,
  nervous: NEUTRAL_BASE,
  musculoskeletal: NEUTRAL_BASE,
};

// Accent colour per system — applied as an emissive glow on the canvas
// regions whose bodyPart maps to the active system. Kept in sync with
// SYSTEM_META.accent below so pill colour, detail-card header, and
// emissive glow all speak the same visual language.
export const SYSTEM_ACCENTS = {
  all: null, // no accent — body stays fully neutral
  cardiovascular: '#D04848',
  respiratory: '#68B28E',
  digestive: '#D48470',
  nervous: '#5EA5D8',
  musculoskeletal: '#A88860',
};

// Which canvas-reachable body parts belong to each system.
// The canvas currently exposes 7 spatial regions (Brain, Heart, Lungs,
// Shoulders, Hands, Legs, Feet); this map determines which of those get
// the emissive glow for a given system. Systems without any clickable
// canvas region (e.g. digestive — we don't have a visible Stomach mesh)
// produce no glow, which is honest rather than fake.
export const SYSTEM_CANVAS_REGIONS = {
  all: [],
  cardiovascular: ['Heart'],
  respiratory: ['Lungs'],
  digestive: [],
  nervous: ['Brain'],
  musculoskeletal: ['Shoulders', 'Hands', 'Legs', 'Feet'],
};

// Metadata for the system filter panel (icons + display labels).
// Icons are lucide-react names the LayerPanel imports.
export const SYSTEM_META = [
  { id: 'all', label: 'All Systems', iconName: 'Layers', accent: '#506cd7' },
  { id: 'cardiovascular', label: 'Cardiovascular', iconName: 'Heart', accent: '#D04848' },
  { id: 'respiratory', label: 'Respiratory', iconName: 'Wind', accent: '#68B28E' },
  { id: 'digestive', label: 'Digestive', iconName: 'Utensils', accent: '#D48470' },
  { id: 'nervous', label: 'Nervous', iconName: 'Brain', accent: '#5EA5D8' },
  { id: 'musculoskeletal', label: 'Musculoskeletal', iconName: 'Dumbbell', accent: '#A88860' },
];

// Highlight colors (Healance brand)
export const HIGHLIGHT_COLOR = new THREE.Color('#0ea5e9');
export const SELECTED_COLOR = new THREE.Color('#14b8a6');

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { classifyAllMeshes } from './regionDetector';
import {
  SYSTEM_PALETTES,
  SYSTEM_ACCENTS,
  SYSTEM_CANVAS_REGIONS,
  MATERIAL_CONFIG,
  HIGHLIGHT_COLOR,
  SELECTED_COLOR,
} from './bodyGeometry';

const MODEL_PATH = `${import.meta.env.BASE_URL}assets/models/Model.glb`;
const TARGET_HEIGHT = 1.7;

const AnatomyModel = ({
  gender,
  activeSystem = 'all',
  selectedPart,
  onPartClick,
  onHover,
  onHoveredGroupChange,
  onLabelAnchorsComputed,
}) => {
  const { scene } = useGLTF(MODEL_PATH);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const targetEmissive = useRef(new Map());
  const modelRef = useRef();
  const entranceProgress = useRef(0);

  const { clonedScene, meshRegionMap, labelAnchors } = useMemo(() => {
    const clone = scene.clone(true);

    // Replace all materials with fresh MeshStandardMaterial. Start fully
    // opaque + depthWrite=true; the palette effect re-enables transparency
    // only for layers that need it, avoiding overlap/ghost artifacts.
    clone.traverse((child) => {
      if (child.isMesh) {
        const newMat = new THREE.MeshStandardMaterial({
          color: '#D07068',
          roughness: MATERIAL_CONFIG.roughness,
          metalness: MATERIAL_CONFIG.metalness,
          envMapIntensity: MATERIAL_CONFIG.envMapIntensity,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 0,
          side: THREE.DoubleSide,
          transparent: false,
          opacity: 1.0,
          depthWrite: true,
        });

        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
        child.material = newMat;
      }
    });

    // Compute overall bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Normalize
    const scaleFactor = TARGET_HEIGHT / size.y;
    clone.scale.multiplyScalar(scaleFactor);
    clone.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor);

    clone.updateMatrixWorld(true);
    const normalizedBox = new THREE.Box3().setFromObject(clone);

    const result = classifyAllMeshes(clone, normalizedBox);

    return {
      clonedScene: clone,
      meshRegionMap: result.meshRegionMap,
      labelAnchors: result.labelAnchors,
    };
  }, [scene]);

  // Apply the system palette when activeSystem changes.
  // Each system maps to ONE flat base colour applied to every mesh — this
  // means no per-region variation, no seams, and no misclassification
  // patches from the spatial bbox classifier. The selected system's
  // signature colour (e.g. red for cardiovascular, blue for nervous) tints
  // the whole body so the user gets immediate visual feedback that their
  // filter is active.
  useEffect(() => {
    const palette = SYSTEM_PALETTES[activeSystem] || SYSTEM_PALETTES.all;
    const hex = palette.base || palette.fallback || '#D07068';
    const opacity = palette.opacity ?? 1.0;
    const needsTransparent = opacity < 1.0;

    for (const [mesh] of meshRegionMap.entries()) {
      mesh.material.color.set(hex);
      mesh.material.roughness = palette.roughness ?? MATERIAL_CONFIG.roughness;
      mesh.material.metalness = palette.metalness ?? MATERIAL_CONFIG.metalness;
      mesh.material.opacity = opacity;
      mesh.material.transparent = needsTransparent;
      mesh.material.depthWrite = !needsTransparent;
      mesh.material.needsUpdate = true;
    }
  }, [activeSystem, meshRegionMap]);

  // Report label anchors
  useEffect(() => {
    onLabelAnchorsComputed?.(labelAnchors);
  }, [labelAnchors, onLabelAnchorsComputed]);

  // Reset entrance animation
  useEffect(() => {
    entranceProgress.current = 0;
  }, [gender]);

  // Notify parent of hovered region
  useEffect(() => {
    onHoveredGroupChange?.(hoveredRegion);
  }, [hoveredRegion, onHoveredGroupChange]);

  const highlightedRegion = hoveredRegion;
  const selectedRegion = selectedPart;

  // Update target emissive. Three states, highest priority first:
  //   1. hover / select → full HIGHLIGHT/SELECTED glow (cyan/teal, intense)
  //   2. system filter active → system accent glow on matching canvas
  //      regions (red for cardiovascular, blue for nervous, etc. — subtle
  //      so the base body stays readable underneath)
  //   3. otherwise → no glow
  useEffect(() => {
    const activeRegionsForSystem = new Set(SYSTEM_CANVAS_REGIONS[activeSystem] || []);
    const accentHex = SYSTEM_ACCENTS[activeSystem];
    const accentColor = accentHex ? new THREE.Color(accentHex) : null;

    for (const [mesh, region] of meshRegionMap.entries()) {
      if (region.bodyPart === selectedRegion) {
        targetEmissive.current.set(mesh, { color: SELECTED_COLOR, intensity: 0.4 });
      } else if (region.bodyPart === highlightedRegion) {
        targetEmissive.current.set(mesh, { color: HIGHLIGHT_COLOR, intensity: 0.3 });
      } else if (accentColor && activeRegionsForSystem.has(region.bodyPart)) {
        targetEmissive.current.set(mesh, { color: accentColor, intensity: 0.28 });
      } else {
        targetEmissive.current.set(mesh, { color: null, intensity: 0 });
      }
    }
  }, [highlightedRegion, selectedRegion, meshRegionMap, activeSystem]);

  // Smooth emissive + entrance
  useFrame((_, delta) => {
    if (entranceProgress.current < 1) {
      entranceProgress.current = Math.min(1, entranceProgress.current + delta * 2.5);
      if (modelRef.current) {
        const t = easeOutCubic(entranceProgress.current);
        const s = 0.95 + 0.05 * t;
        modelRef.current.scale.set(s, s, s);
      }
    }

    for (const [mesh, target] of targetEmissive.current.entries()) {
      const mat = mesh.material;
      if (!mat || !mat.emissive) continue;

      const currentIntensity = mat.emissiveIntensity || 0;
      const diff = target.intensity - currentIntensity;

      if (Math.abs(diff) > 0.005) {
        mat.emissiveIntensity = currentIntensity + diff * 0.12;
        if (target.color && target.intensity > 0) {
          mat.emissive.copy(target.color);
        }
      } else if (Math.abs(diff) > 0) {
        mat.emissiveIntensity = target.intensity;
        if (target.intensity === 0) {
          mat.emissive.set(0x000000);
        }
      }
    }
  });

  const handlePointerMove = useCallback(
    (event) => {
      event.stopPropagation();
      const region = meshRegionMap.get(event.object);
      if (region) {
        setHoveredRegion(region.bodyPart);
        onHover?.(region.bodyPart, region.displayName, event.pointer);
        document.body.style.cursor = 'pointer';
      }
    },
    [meshRegionMap, onHover]
  );

  const handlePointerOut = useCallback(() => {
    setHoveredRegion(null);
    onHover?.(null, null, null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      const region = meshRegionMap.get(event.object);
      if (region) onPartClick?.(region.bodyPart);
    },
    [meshRegionMap, onPartClick]
  );

  return (
    <group ref={modelRef}>
      <primitive
        object={clonedScene}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

useGLTF.preload(MODEL_PATH);

export default AnatomyModel;

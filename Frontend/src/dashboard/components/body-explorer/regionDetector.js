import * as THREE from 'three';

// Display names and bodyData keys for each region
const REGIONS = {
  Brain: { displayName: 'Head', label: 'Head' },
  Heart: { displayName: 'Chest', label: 'Pectorals' },
  Lungs: { displayName: 'Ribcage', label: 'Ribcage' },
  Shoulders: { displayName: 'Shoulder', label: 'Deltoid' },
  Hands: { displayName: 'Arm', label: 'Arm' },
  Legs: { displayName: 'Leg', label: 'Quadriceps' },
  Feet: { displayName: 'Foot', label: 'Foot' },
};

/**
 * Classify a mesh into a body region based on its world-space bounding box center.
 * @param {THREE.Vector3} center - mesh bounding box center in world space
 * @param {THREE.Box3} totalBounds - overall model bounding box
 * @returns {{ bodyPart: string, displayName: string }}
 */
export function classifyRegion(center, totalBounds) {
  const min = totalBounds.min;
  const max = totalBounds.max;
  const height = max.y - min.y;
  const width = max.x - min.x;

  // Normalize Y to 0-1 (0=feet, 1=head)
  const ny = (center.y - min.y) / height;
  // Normalize X to -1..1 (0=center)
  const cx = (max.x + min.x) / 2;
  const nx = (center.x - cx) / (width / 2);
  const absNx = Math.abs(nx);

  // Head
  if (ny > 0.82) {
    return { bodyPart: 'Brain', ...REGIONS.Brain };
  }

  // Upper body zone
  if (ny > 0.55) {
    // Arms/shoulders (far from center)
    if (absNx > 0.4) {
      if (ny > 0.72) return { bodyPart: 'Shoulders', ...REGIONS.Shoulders };
      return { bodyPart: 'Hands', ...REGIONS.Hands };
    }
    // Chest
    if (ny > 0.65) return { bodyPart: 'Heart', ...REGIONS.Heart };
    // Ribcage
    return { bodyPart: 'Lungs', ...REGIONS.Lungs };
  }

  // Mid body
  if (ny > 0.42) {
    // Hands at side
    if (absNx > 0.35) return { bodyPart: 'Hands', ...REGIONS.Hands };
    // Abdomen (maps to Lungs in bodyData)
    return { bodyPart: 'Lungs', ...REGIONS.Lungs };
  }

  // Lower body
  if (ny > 0.08) {
    return { bodyPart: 'Legs', ...REGIONS.Legs };
  }

  // Feet
  return { bodyPart: 'Feet', ...REGIONS.Feet };
}

/**
 * Classify all meshes in a scene and build region maps.
 * @param {THREE.Object3D} scene - the loaded & normalized model scene
 * @param {THREE.Box3} totalBounds - overall model bounding box
 * @returns {{ meshRegionMap: Map, regionMeshMap: Map, labelAnchors: Array }}
 */
export function classifyAllMeshes(scene, totalBounds) {
  const meshRegionMap = new Map(); // mesh → { bodyPart, displayName }
  const regionMeshMap = new Map(); // bodyPart → [mesh1, mesh2, ...]
  const regionCenters = new Map(); // bodyPart → [center1, center2, ...] for label position

  scene.traverse((child) => {
    if (child.isMesh) {
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());
      const region = classifyRegion(meshCenter, totalBounds);

      meshRegionMap.set(child, region);

      if (!regionMeshMap.has(region.bodyPart)) {
        regionMeshMap.set(region.bodyPart, []);
        regionCenters.set(region.bodyPart, []);
      }
      regionMeshMap.get(region.bodyPart).push(child);
      regionCenters.get(region.bodyPart).push(meshCenter);
    }
  });

  // Compute label anchors: average center per region, biased to front
  const labelAnchors = [];
  const seenParts = new Set();

  for (const [bodyPart, centers] of regionCenters.entries()) {
    if (seenParts.has(bodyPart)) continue;
    seenParts.add(bodyPart);

    const avg = new THREE.Vector3();
    centers.forEach((c) => avg.add(c));
    avg.divideScalar(centers.length);

    // Determine side based on position
    const midX = (totalBounds.max.x + totalBounds.min.x) / 2;
    const side = avg.x > midX ? 'right' : 'left';

    const region = REGIONS[bodyPart];
    if (region) {
      labelAnchors.push({
        bodyPart,
        label: region.label,
        pos: [avg.x, avg.y, avg.z],
        side,
      });
    }
  }

  return { meshRegionMap, regionMeshMap, labelAnchors };
}

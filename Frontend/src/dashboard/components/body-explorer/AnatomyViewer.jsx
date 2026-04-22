import React, { Suspense, useRef, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import AnatomyModel from './AnatomyModel';
import AnatomyLabels from './AnatomyLabels';
import ViewerControls from './ViewerControls';
import LayerPanel from './LayerPanel';
import LoadingOverlay from './LoadingOverlay';

const DEFAULT_CAMERA = {
  position: [0, 1.0, 2.8],
  target: [0, 0.85, 0],
  fov: 40,
};

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
    console.error('Body Explorer failed to load 3D scene:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const ModelErrorOverlay = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white z-20 px-6 text-center">
    <p className="text-base font-semibold text-slate-800">Could not load the 3D model</p>
    <p className="text-sm text-slate-500 mt-2 max-w-md">
      Please refresh the page. If the issue continues, check your connection and verify the model
      file is available.
    </p>
  </div>
);

function Scene({
  gender,
  activeSystem,
  selectedPart,
  onPartClick,
  onHover,
  onControlsReady,
  showLabels,
  onLabelAnchorsComputed,
}) {
  const orbitRef = useRef();
  const idleTimer = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [labelAnchors, setLabelAnchors] = useState([]);

  useEffect(() => {
    if (orbitRef.current) {
      onControlsReady?.(orbitRef.current);
    }
  }, [onControlsReady]);

  const handleInteractionStart = useCallback(() => {
    setAutoRotate(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAutoRotate(true), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const handleLabelAnchors = useCallback(
    (anchors) => {
      setLabelAnchors(anchors);
      onLabelAnchorsComputed?.(anchors);
    },
    [onLabelAnchorsComputed]
  );

  return (
    <>
      <Environment preset="studio" />

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} color="#ffeedd" />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#ddeeff" />
      <directionalLight position={[0, 3, -5]} intensity={0.3} color="#ffffff" />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        blur={2.5}
        far={2}
        resolution={256}
        color="#444444"
      />

      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        target={DEFAULT_CAMERA.target}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        rotateSpeed={0.5}
        enablePan
        panSpeed={0.5}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        onStart={handleInteractionStart}
        onEnd={handleInteractionEnd}
      />

      <AnatomyModel
        gender={gender}
        activeSystem={activeSystem}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        onHover={onHover}
        onHoveredGroupChange={setHoveredRegion}
        onLabelAnchorsComputed={handleLabelAnchors}
      />

      <AnatomyLabels
        showLabels={showLabels}
        labelAnchors={labelAnchors}
        hoveredRegion={hoveredRegion}
        selectedPart={selectedPart}
        onLabelClick={onPartClick}
      />
    </>
  );
}

const AnatomyViewer = ({
  gender,
  selectedPart,
  onPartClick,
  onHover,
  activeSystem,
  onSystemChange,
  catalog,
  catalogLoading,
  onPartSelect,
}) => {
  const controlsRef = useRef(null);
  const showLabels = false;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSceneError, setHasSceneError] = useState(false);
  const containerRef = useRef();
  const [isFocused, setIsFocused] = useState(false);

  const handleHover = useCallback(
    (bodyPartKey) => {
      onHover?.(bodyPartKey);
    },
    [onHover]
  );

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;

      gsap.to(camera.position, {
        x: DEFAULT_CAMERA.position[0],
        y: DEFAULT_CAMERA.position[1],
        z: DEFAULT_CAMERA.position[2],
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
      });

      gsap.to(controls.target, {
        x: DEFAULT_CAMERA.target[0],
        y: DEFAULT_CAMERA.target[1],
        z: DEFAULT_CAMERA.target[2],
        duration: 0.8,
        ease: 'power2.inOut',
      });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;
      const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
      gsap.to(camera.position, {
        x: camera.position.x + dir.x * 0.5,
        y: camera.position.y + dir.y * 0.5,
        z: camera.position.z + dir.z * 0.5,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => controls.update(),
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;
      const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
      gsap.to(camera.position, {
        x: camera.position.x - dir.x * 0.5,
        y: camera.position.y - dir.y * 0.5,
        z: camera.position.z - dir.z * 0.5,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => controls.update(),
      });
    }
  }, []);

  const handleControlsReady = useCallback((controls) => {
    controlsRef.current = controls;
  }, []);

  // Keyboard rotate/zoom/reset — only fires when the viewer container has
  // focus, so typing in search doesn't move the camera. Arrow keys rotate,
  // +/- zoom, R resets. Layer switching (1-4) is handled at page level so
  // it works globally.
  const handleKeyDown = useCallback(
    (e) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const camera = controls.object;
      const rotateStep = Math.PI / 24;
      const zoomStep = 0.35;

      // Rotate by temporarily scripting the orbit controls' angle.
      const rotate = (azim, polar) => {
        const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += azim;
        spherical.phi = Math.max(
          controls.minPolarAngle,
          Math.min(controls.maxPolarAngle, spherical.phi + polar)
        );
        const newOffset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(controls.target).add(newOffset);
        controls.update();
      };
      const zoom = (delta) => {
        const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
        camera.position.addScaledVector(dir, delta);
        controls.update();
      };

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rotate(-rotateStep, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        rotate(rotateStep, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        rotate(0, -rotateStep);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        rotate(0, rotateStep);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoom(zoomStep);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoom(-zoomStep);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetCamera();
      }
    },
    [handleResetCamera]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      role="application"
      aria-label="Interactive 3D anatomy viewer. Use arrow keys to rotate, plus or minus to zoom, R to reset view. Press 1 to 4 to switch layers."
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Loading overlay shown until model renders */}
      {!isLoaded && !hasSceneError && <LoadingOverlay />}
      {hasSceneError && <ModelErrorOverlay />}

      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: DEFAULT_CAMERA.position,
          fov: DEFAULT_CAMERA.fov,
          near: 0.1,
          far: 100,
        }}
        frameloop="always"
        style={{ touchAction: 'none' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <SceneErrorBoundary
          fallback={null}
          onError={() => {
            setHasSceneError(true);
            setIsLoaded(false);
          }}
        >
          <Suspense fallback={null}>
            <Scene
              gender={gender}
              activeSystem={activeSystem}
              selectedPart={selectedPart}
              onPartClick={onPartClick}
              onHover={handleHover}
              onControlsReady={handleControlsReady}
              showLabels={showLabels}
              onLabelAnchorsComputed={() => {
                setIsLoaded(true);
                setHasSceneError(false);
              }}
            />
          </Suspense>
        </SceneErrorBoundary>
      </Canvas>

      {/* System filter panel (left side) */}
      <LayerPanel
        activeSystem={activeSystem}
        onSystemChange={onSystemChange}
        catalog={catalog}
        catalogLoading={catalogLoading}
        onPartSelect={onPartSelect}
      />

      {/* Bottom toolbar */}
      <ViewerControls
        onResetCamera={handleResetCamera}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
};

export default AnatomyViewer;

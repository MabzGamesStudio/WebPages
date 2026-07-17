import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { SpiralPoint3D } from '../../utils/spiralGeometry';
import SpiralPath from './SpiralPath';
import CameraRig, { type ViewPreset } from './CameraRig';

interface SpiralSceneProps {
  points: SpiralPoint3D[];
  currentIndex: number;
  view: ViewPreset;
}

export default function SpiralScene({ points, currentIndex, view }: SpiralSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  const maxAbsAnomaly = useMemo(
    () => points.reduce((m, p) => Math.max(m, Math.abs(p.anomaly)), 1),
    [points]
  );
  const height = useMemo(() => points[points.length - 1]?.y ?? 1, [points]);
  const center = height / 2;

  return (
    <Canvas
      orthographic
      camera={{ position: [4, 3, 5], zoom: 80, near: 0.1, far: 100 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a0e14']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <pointLight position={[-4, 2, -4]} intensity={0.3} color="#3a86ff" />

      <Suspense fallback={null}>
        <SpiralPath points={points} currentIndex={currentIndex} maxAbsAnomaly={maxAbsAnomaly} />
      </Suspense>

      <gridHelper
        args={[6, 12, '#232a38', '#1a2029']}
        position={[0, -0.15, 0]}
      />

      <CameraRig view={view} height={height} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        target={[0, center, 0]}
        enableDamping
        dampingFactor={0.08}
        makeDefault
        minDistance={1.5}
        maxDistance={40}
      />
    </Canvas>
  );
}

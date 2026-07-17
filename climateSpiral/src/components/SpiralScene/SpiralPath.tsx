import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { SpiralPoint3D } from '../../utils/spiralGeometry';
import { anomalyToColor } from '../../utils/spiralGeometry';

interface SpiralPathProps {
  points: SpiralPoint3D[];
  currentIndex: number;
  maxAbsAnomaly: number;
}

export default function SpiralPath({ points, currentIndex, maxAbsAnomaly }: SpiralPathProps) {
  const visible = useMemo(() => points.slice(0, currentIndex + 1), [points, currentIndex]);

  const linePoints = useMemo<[number, number, number][]>(
    () => visible.map((p) => [p.x, p.y, p.z]),
    [visible]
  );

  const colors = useMemo(
    () =>
      visible.map((p) => {
        const c = new THREE.Color(anomalyToColor(p.anomaly, maxAbsAnomaly));
        return [c.r, c.g, c.b] as [number, number, number];
      }),
    [visible, maxAbsAnomaly]
  );

  const head = visible[visible.length - 1];

  if (visible.length < 2) return null;

  return (
    <group>
      <Line points={linePoints} vertexColors={colors} lineWidth={2.4} />
      {head && (
        <mesh position={[head.x, head.y, head.z]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={anomalyToColor(head.anomaly, maxAbsAnomaly)} />
        </mesh>
      )}
    </group>
  );
}

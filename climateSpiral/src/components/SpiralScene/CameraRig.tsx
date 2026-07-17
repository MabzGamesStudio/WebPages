import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type ViewPreset = 'orbit' | 'top' | 'side';

interface CameraRigProps {
  view: ViewPreset;
  height: number; // total helix height, used to frame the shot
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

export default function CameraRig({ view, height, controlsRef }: CameraRigProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    const midHeight = height / 2;
    const span = Math.max(3, height);

    if (view === 'top') {
      target.current.set(0.01, midHeight + span * 1.1, 0.01);
      targetLookAt.current.set(0, midHeight, 0);
    } else if (view === 'side') {
      target.current.set(span * 1.4, midHeight, 0.01);
      targetLookAt.current.set(0, midHeight, 0);
    } else {
      target.current.set(span * 0.9, midHeight + span * 0.5, span * 0.9);
      targetLookAt.current.set(0, midHeight, 0);
    }
    animating.current = true;
  }, [view, height]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(target.current, 0.08);

    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(targetLookAt.current, 0.08);
      controls.update();
    }

    if (camera.position.distanceTo(target.current) < 0.01) {
      animating.current = false;
    }
  });

  return null;
}

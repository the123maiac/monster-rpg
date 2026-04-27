import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTimeWeather } from '@/systems/timeWeather';

const COUNT = 320;

export default function Weather() {
  const weather = useTimeWeather((s) => s.weather);
  const { camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; vy: number; vx: number; r: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 50,
        y: Math.random() * 25,
        z: (Math.random() - 0.5) * 50,
        vy: weather === 'rain' ? -22 : -1.2,
        vx: weather === 'leaves' ? Math.sin(i) * 0.6 : 0.1,
        r: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [weather]);

  useFrame((_, dt) => {
    if (!meshRef.current || weather === 'clear') return;
    const cam = camera.position;
    for (let i = 0; i < COUNT; i++) {
      const p = positions[i];
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.r += dt * 1.5;
      if (p.y < -1) {
        p.y = 22 + Math.random() * 6;
        p.x = cam.x + (Math.random() - 0.5) * 40;
        p.z = cam.z + (Math.random() - 0.5) * 40;
      }
      // Keep within camera radius
      if (Math.abs(p.x - cam.x) > 30 || Math.abs(p.z - cam.z) > 30) {
        p.x = cam.x + (Math.random() - 0.5) * 40;
        p.z = cam.z + (Math.random() - 0.5) * 40;
      }
      dummy.position.set(p.x, p.y, p.z);
      if (weather === 'leaves') {
        dummy.rotation.set(p.r, p.r * 0.7, 0);
        dummy.scale.setScalar(0.18);
      } else {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.04, 0.6, 0.04);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (weather === 'clear') return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      {weather === 'rain' ? (
        <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
      ) : (
        <coneGeometry args={[0.18, 0.05, 4]} />
      )}
      <meshStandardMaterial
        color={weather === 'rain' ? '#9bc4ff' : '#e0a060'}
        emissive={weather === 'rain' ? '#3aa6ff' : '#a06030'}
        emissiveIntensity={0.3}
        transparent
        opacity={weather === 'rain' ? 0.65 : 0.85}
      />
    </instancedMesh>
  );
}

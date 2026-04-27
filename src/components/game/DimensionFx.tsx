import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const COUNT = 220;

interface ParticleConfig {
  count: number;
  color: string;
  emissive: string;
  size: number;
  spread: number;
  riseSpeed: number;
  swirl: number;
  shape: 'sphere' | 'oct' | 'cone';
  floor: number;
  ceil: number;
}

function configFor(dimension: string): ParticleConfig | null {
  switch (dimension) {
    case 'aetheria':
      return { count: 90, color: '#fff3a3', emissive: '#ffd83d', size: 0.06, spread: 30, riseSpeed: 0.4, swirl: 0.6, shape: 'sphere', floor: 0.3, ceil: 4 };
    case 'emberreach':
      return { count: 220, color: '#ff8a3a', emissive: '#ff5a1a', size: 0.08, spread: 32, riseSpeed: 1.2, swirl: 0.4, shape: 'oct', floor: 0.2, ceil: 6 };
    case 'tidewell':
      return { count: 140, color: '#a3e8ff', emissive: '#3aa6ff', size: 0.07, spread: 32, riseSpeed: -0.4, swirl: 0.8, shape: 'sphere', floor: 0.5, ceil: 4 };
    case 'voidspire':
      return { count: 180, color: '#9b8aff', emissive: '#6b3dff', size: 0.1, spread: 28, riseSpeed: 0.3, swirl: 0.5, shape: 'oct', floor: 0.2, ceil: 5 };
    case 'skyloft':
      return { count: 120, color: '#ffffff', emissive: '#cfeaff', size: 0.18, spread: 36, riseSpeed: 0.2, swirl: 0.3, shape: 'sphere', floor: 1.2, ceil: 8 };
    default:
      return null;
  }
}

interface FloatingIsland {
  x: number; y: number; z: number; r: number;
}

export default function DimensionFx() {
  const dimension = useGameStore((s) => s.player.dimension);
  const cfg = useMemo(() => configFor(dimension), [dimension]);

  return (
    <>
      {cfg && <Particles cfg={cfg} key={dimension} />}
      {dimension === 'skyloft' && <SkylandIslands />}
      {dimension === 'voidspire' && <VoidspireMushrooms />}
      {dimension === 'tidewell' && <TidewellFoam />}
      {dimension === 'emberreach' && <EmberreachLavaCracks />}
    </>
  );
}

function Particles({ cfg }: { cfg: ParticleConfig }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();
  const particles = useMemo(
    () =>
      Array.from({ length: cfg.count }, () => ({
        x: (Math.random() - 0.5) * cfg.spread,
        y: cfg.floor + Math.random() * (cfg.ceil - cfg.floor),
        z: (Math.random() - 0.5) * cfg.spread,
        phase: Math.random() * Math.PI * 2,
      })),
    [cfg]
  );

  useFrame((s, dt) => {
    if (!meshRef.current) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += cfg.riseSpeed * dt;
      if (p.y > cfg.ceil) p.y = cfg.floor;
      if (p.y < cfg.floor) p.y = cfg.ceil;
      const sx = camera.position.x + p.x + Math.sin(t * cfg.swirl + p.phase) * 0.6;
      const sy = p.y;
      const sz = camera.position.z - 5 + p.z + Math.cos(t * cfg.swirl + p.phase) * 0.6;
      // Wrap around player
      let dx = sx - camera.position.x;
      let dz = sz - camera.position.z;
      if (Math.abs(dx) > cfg.spread / 2) p.x -= Math.sign(dx) * cfg.spread;
      if (Math.abs(dz) > cfg.spread / 2) p.z -= Math.sign(dz) * cfg.spread;
      dummy.position.set(sx, sy, sz);
      dummy.scale.setScalar(cfg.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cfg.count]}>
      {cfg.shape === 'oct' ? (
        <octahedronGeometry args={[1, 0]} />
      ) : cfg.shape === 'cone' ? (
        <coneGeometry args={[1, 1.6, 6]} />
      ) : (
        <sphereGeometry args={[1, 6, 5]} />
      )}
      <meshStandardMaterial
        color={cfg.color}
        emissive={cfg.emissive}
        emissiveIntensity={1.2}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

function SkylandIslands() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const islands = useMemo(() => {
    const arr: FloatingIsland[] = [];
    for (let i = 0; i < 14; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        y: 8 + Math.random() * 10,
        z: (Math.random() - 0.5) * 60,
        r: 1.5 + Math.random() * 2.0,
      });
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(camera.position.x, 0, camera.position.z - 6);
    groupRef.current.children.forEach((c, i) => {
      c.position.y = islands[i].y + Math.sin(s.clock.elapsedTime * 0.4 + i) * 0.5;
      c.rotation.y = s.clock.elapsedTime * 0.05 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={groupRef}>
      {islands.map((isl, i) => (
        <group key={i} position={[isl.x, isl.y, isl.z]}>
          <mesh castShadow>
            <coneGeometry args={[isl.r, isl.r * 1.5, 6]} />
            <meshStandardMaterial color="#7a5e3d" />
          </mesh>
          <mesh position={[0, isl.r * 0.5, 0]} castShadow>
            <cylinderGeometry args={[isl.r, isl.r * 1.2, isl.r * 0.4, 12]} />
            <meshStandardMaterial color="#5fcf6e" />
          </mesh>
          {/* Tiny tree on top */}
          <group position={[0, isl.r * 0.7, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
              <meshStandardMaterial color="#7a4a25" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <coneGeometry args={[0.4, 0.7, 6]} />
              <meshStandardMaterial color="#3aa14c" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function VoidspireMushrooms() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const mushrooms = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
        s: 0.4 + Math.random() * 0.7,
        c: ['#7be0c4', '#c98aff', '#a3e8ff', '#9b8aff'][Math.floor(Math.random() * 4)],
        wobble: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(camera.position.x, 0, camera.position.z - 4);
    groupRef.current.children.forEach((c, i) => {
      c.scale.y = mushrooms[i].s * (1 + Math.sin(s.clock.elapsedTime * 1.5 + mushrooms[i].wobble) * 0.06);
    });
  });

  return (
    <group ref={groupRef}>
      {mushrooms.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]} scale={[m.s, m.s, m.s]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.8, 6]} />
            <meshStandardMaterial color="#3a2a4a" />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={m.c} emissive={m.c} emissiveIntensity={1.4} />
          </mesh>
          <pointLight position={[0, 0.95, 0]} color={m.c} intensity={0.5} distance={3} />
        </group>
      ))}
    </group>
  );
}

function TidewellFoam() {
  const { camera } = useThree();
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const foams = useMemo(
    () => Array.from({ length: 50 }, () => ({
      x: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 50,
      r: 1 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    })),
    []
  );

  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < foams.length; i++) {
      const f = foams[i];
      const cx = camera.position.x + f.x;
      const cz = camera.position.z - 4 + f.z;
      const expand = 0.5 + (Math.sin(t * 0.8 + f.phase) + 1) / 2;
      dummy.position.set(cx, 0.07, cz);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(f.r * expand);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, foams.length]}>
      <ringGeometry args={[0.8, 1.0, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#a3e8ff" emissiveIntensity={0.6} transparent opacity={0.55} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function EmberreachLavaCracks() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const cracks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
        rot: Math.random() * Math.PI * 2,
        len: 2 + Math.random() * 4,
      });
    }
    return arr;
  }, []);
  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(camera.position.x, 0, camera.position.z - 4);
    const t = s.clock.elapsedTime;
    groupRef.current.children.forEach((c, i) => {
      const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(t * 1.5 + i) * 0.4;
    });
  });
  return (
    <group ref={groupRef}>
      {cracks.map((c, i) => (
        <mesh
          key={i}
          position={[c.x, 0.06, c.z]}
          rotation={[-Math.PI / 2, 0, c.rot]}
        >
          <planeGeometry args={[0.25, c.len]} />
          <meshStandardMaterial color="#ff6b1a" emissive="#ff4a1a" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

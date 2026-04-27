import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const seed = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

function House({ position, color = '#d24a4a', door = '#6e3a1f', roof = '#7a2828' }: { position: [number, number, number]; color?: string; door?: string; roof?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 2, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.6, 1.6, 4]} />
        <meshStandardMaterial color={roof} />
      </mesh>
      <mesh position={[0, 0.7, 2.01]}>
        <boxGeometry args={[0.7, 1.4, 0.05]} />
        <meshStandardMaterial color={door} />
      </mesh>
      <mesh position={[1.4, 1.2, 2.01]}>
        <boxGeometry args={[0.7, 0.7, 0.05]} />
        <meshStandardMaterial color="#ade1ff" emissive="#3aa6ff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-1.4, 1.2, 2.01]}>
        <boxGeometry args={[0.7, 0.7, 0.05]} />
        <meshStandardMaterial color="#ade1ff" emissive="#3aa6ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Lab({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[6, 2.8, 5]} />
        <meshStandardMaterial color="#d8d3c4" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[6.6, 0.6, 5.6]} />
        <meshStandardMaterial color="#5b6470" />
      </mesh>
      <mesh position={[0, 4.0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 16]} />
        <meshStandardMaterial color="#a64a4a" />
      </mesh>
      <mesh position={[0, 4.7, 0]} castShadow>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshStandardMaterial color="#ffd83d" emissive="#ff9a00" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 2.51]}>
        <boxGeometry args={[1, 1.6, 0.05]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

function GrassPatch() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.rotation.z = Math.sin(t * 1.3 + i) * 0.08;
      }
    });
  });
  const blades = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    for (let i = 0; i < 220; i++) {
      const r = seed(i * 7.13);
      const r2 = seed(i * 13.71);
      const r3 = seed(i * 19.31);
      const x = -16 + r * 32;
      const z = 22 + r2 * 22;
      arr.push({ pos: [x, 0.18, z], scale: 0.6 + r3 * 0.5, rot: r * Math.PI });
    }
    return arr;
  }, []);
  return (
    <group ref={groupRef}>
      {blades.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]} scale={[1, b.scale, 1]}>
          <coneGeometry args={[0.18, 0.6, 4]} />
          <meshStandardMaterial color="#5fa55a" />
        </mesh>
      ))}
    </group>
  );
}

function Pond() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.05 + Math.sin(s.clock.elapsedTime * 1.5) * 0.02;
    }
  });
  return (
    <group position={[16, 0, 14]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[3.3, 36]} />
        <meshStandardMaterial color="#7a5e3d" />
      </mesh>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[3, 36]} />
        <meshStandardMaterial color="#3aa6ff" transparent opacity={0.85} emissive="#1c5a8c" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

export default function SpawnTown() {
  return (
    <group>
      {/* Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 12]} receiveShadow>
        <planeGeometry args={[3, 60]} />
        <meshStandardMaterial color="#c9a875" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.02, -2]} receiveShadow>
        <planeGeometry args={[14, 3]} />
        <meshStandardMaterial color="#c9a875" />
      </mesh>

      {/* Town houses & lab */}
      <House position={[-8, 0, 4]} color="#d24a4a" />
      <Lab position={[-16, 0, -8]} />
      <House position={[12, 0, 4]} color="#4ad27e" roof="#287a4a" />

      {/* Town signpost */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
          <meshStandardMaterial color="#5b3a1f" />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.2, 0.4, 0.1]} />
          <meshStandardMaterial color="#caa066" />
        </mesh>
      </group>

      {/* Tall grass area floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 33]} receiveShadow>
        <planeGeometry args={[32, 22]} />
        <meshStandardMaterial color="#6aaa55" />
      </mesh>

      {/* Pond */}
      <Pond />

      {/* Animated grass */}
      <GrassPatch />

      {/* Northern gate */}
      <group position={[0, 0, 49]}>
        <mesh position={[-3, 1.2, 0]}>
          <boxGeometry args={[0.5, 2.4, 0.5]} />
          <meshStandardMaterial color="#5b3a1f" />
        </mesh>
        <mesh position={[3, 1.2, 0]}>
          <boxGeometry args={[0.5, 2.4, 0.5]} />
          <meshStandardMaterial color="#5b3a1f" />
        </mesh>
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[7, 0.5, 0.4]} />
          <meshStandardMaterial color="#5b3a1f" />
        </mesh>
      </group>
    </group>
  );
}

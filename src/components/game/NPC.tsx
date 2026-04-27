import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { NPCData } from '@/types';

export default function NPC({ data, defeated }: { data: NPCData; defeated?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + data.position[0]) * 0.05;
  });
  return (
    <group ref={ref} position={data.position} rotation={[0, data.rotation ?? 0, 0]}>
      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.55, 6, 12]} />
        <meshStandardMaterial color={data.color} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#f5d2a0" />
      </mesh>
      {data.hat === 'lab' && (
        <mesh position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
      {data.hat === 'cap' && (
        <>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.16, 16]} />
            <meshStandardMaterial color="#1c4a8c" />
          </mesh>
          <mesh position={[0, 1.36, 0.32]}>
            <boxGeometry args={[0.5, 0.06, 0.18]} />
            <meshStandardMaterial color="#1c4a8c" />
          </mesh>
        </>
      )}
      {data.hat === 'ranger' && (
        <mesh position={[0, 1.5, 0]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.42, 0.4, 4]} />
          <meshStandardMaterial color="#3a6a3a" />
        </mesh>
      )}
      {/* Eyes */}
      <mesh position={[-0.1, 1.22, 0.28]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.1, 1.22, 0.28]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Trainer marker */}
      {data.isTrainer && !defeated && (
        <mesh position={[0, 2.0, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#ffd83d" emissive="#ffd83d" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

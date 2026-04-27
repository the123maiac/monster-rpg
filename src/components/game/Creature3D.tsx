import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPECIES } from '@/data/creatures';

interface Props {
  speciesId: string;
  position?: [number, number, number];
  scale?: number;
  shiny?: boolean;
  bob?: boolean;
  facing?: number;
}

const SHINY_TINT = '#fff5b3';

export default function Creature3D({ speciesId, position = [0, 0, 0], scale = 1, shiny, bob = true, facing = 0 }: Props) {
  const ref = useRef<THREE.Group>(null);
  const sp = SPECIES[speciesId];
  const color = useMemo(() => new THREE.Color(shiny ? SHINY_TINT : sp.colorPrimary), [shiny, sp.colorPrimary]);
  const colorB = useMemo(() => new THREE.Color(sp.colorSecondary), [sp.colorSecondary]);

  useFrame((state) => {
    if (!ref.current) return;
    if (bob) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.08;
      ref.current.rotation.y = facing + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  const geo = sp.geometry;
  const s = sp.scale * scale;
  return (
    <group ref={ref} position={position} rotation={[0, facing, 0]} scale={[s, s, s]}>
      {/* Shadow blob */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>

      {/* Main body */}
      <mesh castShadow>
        {geo === 'sphere' && <sphereGeometry args={[0.6, 24, 18]} />}
        {geo === 'cube' && <boxGeometry args={[0.95, 0.95, 0.95]} />}
        {geo === 'cone' && <coneGeometry args={[0.55, 1.1, 18]} />}
        {geo === 'capsule' && <capsuleGeometry args={[0.45, 0.45, 6, 12]} />}
        {geo === 'octahedron' && <octahedronGeometry args={[0.7, 0]} />}
        {geo === 'torus' && <torusGeometry args={[0.45, 0.18, 12, 24]} />}
        {geo === 'pyramid' && <coneGeometry args={[0.7, 1.1, 4]} />}
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} emissive={shiny ? '#fff7c2' : '#000'} emissiveIntensity={shiny ? 0.25 : 0} />
      </mesh>

      {/* Belly / accent */}
      <mesh position={[0, -0.05, 0.25]} scale={[0.7, 0.55, 0.5]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color={colorB} roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.18, 0.18, 0.5]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.18, 0.18, 0.5]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.18, 0.18, 0.56]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.18, 0.18, 0.56]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Cheek blush */}
      <mesh position={[-0.32, 0.0, 0.42]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#ff9aa2" />
      </mesh>
      <mesh position={[0.32, 0.0, 0.42]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#ff9aa2" />
      </mesh>

      {/* Element flair: small ear/horn/wing */}
      {sp.element === 'Flame' && (
        <mesh position={[0, 0.6, -0.1]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.18, 0.45, 8]} />
          <meshStandardMaterial color="#ffd83d" emissive="#ff8a3d" emissiveIntensity={0.6} />
        </mesh>
      )}
      {sp.element === 'Aqua' && (
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshStandardMaterial color="#a3e8ff" emissive="#3da7ff" emissiveIntensity={0.4} transparent opacity={0.8} />
        </mesh>
      )}
      {sp.element === 'Leaf' && (
        <mesh position={[0, 0.7, 0]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.22, 0.3, 5]} />
          <meshStandardMaterial color="#7be08c" />
        </mesh>
      )}
      {sp.element === 'Spark' && (
        <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 6]}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color="#fff3a3" emissive="#ffd83d" emissiveIntensity={0.8} />
        </mesh>
      )}
      {sp.element === 'Stone' && (
        <mesh position={[0, 0.55, 0]}>
          <dodecahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#6e5a44" />
        </mesh>
      )}
      {sp.element === 'Shadow' && (
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshStandardMaterial color="#211a3d" emissive="#6b3dff" emissiveIntensity={0.5} />
        </mesh>
      )}
      {sp.element === 'Light' && (
        <mesh position={[0, 0.8, 0]}>
          <torusGeometry args={[0.22, 0.03, 8, 24]} />
          <meshStandardMaterial color="#fff3a3" emissive="#ffd83d" emissiveIntensity={1.2} />
        </mesh>
      )}
      {sp.element === 'Wind' && (
        <>
          <mesh position={[-0.55, 0.2, 0]} rotation={[0, 0.3, 0.4]}>
            <coneGeometry args={[0.12, 0.5, 6]} />
            <meshStandardMaterial color="#a3e8ff" />
          </mesh>
          <mesh position={[0.55, 0.2, 0]} rotation={[0, -0.3, -0.4]}>
            <coneGeometry args={[0.12, 0.5, 6]} />
            <meshStandardMaterial color="#a3e8ff" />
          </mesh>
        </>
      )}
    </group>
  );
}

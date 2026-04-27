import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHUNK_SIZE, type ChunkData } from '@/systems/world';

interface Props {
  chunk: ChunkData;
}

export default function Chunk({ chunk }: Props) {
  const { centerX, centerZ, biome, features, structures, portals, boss } = chunk;

  // Group features by type for batch rendering
  const trees = useMemo(() => features.filter((f) => f.type === 'tree'), [features]);
  const rocks = useMemo(() => features.filter((f) => f.type === 'rock'), [features]);
  const grass = useMemo(() => features.filter((f) => f.type === 'grass'), [features]);
  const flowers = useMemo(() => features.filter((f) => f.type === 'flower'), [features]);

  const grassRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    if (!grassRef.current) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < grass.length; i++) {
      const f = grass[i];
      dummy.position.set(f.x, 0.18, f.z);
      dummy.rotation.set(0, f.variation * Math.PI, Math.sin(t * 1.3 + i) * 0.08);
      dummy.scale.set(1, f.scale, 1);
      dummy.updateMatrix();
      grassRef.current.setMatrixAt(i, dummy.matrix);
    }
    grassRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Ground tile */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX + CHUNK_SIZE / 2, biome.isWater ? -0.3 : 0, centerZ + CHUNK_SIZE / 2]}
        receiveShadow
      >
        <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
        <meshStandardMaterial color={biome.ground} />
      </mesh>

      {biome.isWater && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centerX + CHUNK_SIZE / 2, 0.05, centerZ + CHUNK_SIZE / 2]}
        >
          <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
          <meshStandardMaterial color={biome.accent} transparent opacity={0.7} emissive={biome.accent} emissiveIntensity={0.2} />
        </mesh>
      )}

      {biome.isHazard && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centerX + CHUNK_SIZE / 2, 0.05, centerZ + CHUNK_SIZE / 2]}
        >
          <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
          <meshStandardMaterial color={biome.accent} emissive={biome.accent} emissiveIntensity={0.6} />
        </mesh>
      )}

      {/* Trees */}
      {trees.map((t, i) => (
        <Tree
          key={`t-${chunk.cx}-${chunk.cy}-${i}`}
          x={t.x}
          z={t.z}
          scale={t.scale}
          color={biome.treeColor ?? '#3aa14c'}
        />
      ))}

      {/* Rocks */}
      {rocks.map((r, i) => (
        <Rock
          key={`r-${chunk.cx}-${chunk.cy}-${i}`}
          x={r.x}
          z={r.z}
          scale={r.scale}
          color={biome.rockColor ?? '#8c8474'}
        />
      ))}

      {/* Grass tufts via instanced mesh */}
      {grass.length > 0 && (
        <instancedMesh ref={grassRef} args={[undefined, undefined, grass.length]}>
          <coneGeometry args={[0.18, 0.6, 4]} />
          <meshStandardMaterial color={biome.id === 'tallgrass' ? '#5fa55a' : biome.id === 'ember' ? '#d6532a' : biome.id === 'glow' ? '#7be0c4' : '#5fa55a'} />
        </instancedMesh>
      )}

      {/* Flowers */}
      {flowers.map((f, i) => (
        <Flower
          key={`f-${chunk.cx}-${chunk.cy}-${i}`}
          x={f.x}
          z={f.z}
          color={biome.flowerPalette[f.variation] ?? '#fff'}
        />
      ))}

      {/* Structures */}
      {structures.map((s, i) => {
        const key = `s-${chunk.cx}-${chunk.cy}-${i}`;
        if (s.type === 'campfire') return <Campfire key={key} x={s.x} z={s.z} />;
        if (s.type === 'lavapool') return <LavaPool key={key} x={s.x} z={s.z} />;
        if (s.type === 'islandhut') return <IslandHut key={key} x={s.x} z={s.z} rot={s.rotation} />;
        if (s.type === 'voidshrine') return <VoidShrine key={key} x={s.x} z={s.z} rot={s.rotation} />;
        if (s.type === 'cloud_island') return <CloudIsland key={key} x={s.x} z={s.z} />;
        return null;
      })}

      {/* Portals */}
      {portals.map((p, i) => (
        <PortalMarker key={`p-${chunk.cx}-${chunk.cy}-${i}`} x={p.x} z={p.z} color={p.color} />
      ))}

      {/* Boss spawn marker */}
      {boss && !boss.defeated && <BossMarker x={boss.x} z={boss.z} />}
    </group>
  );
}

function Tree({ x, z, scale, color }: { x: number; z: number; scale: number; color: string }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 1.2, 8]} />
        <meshStandardMaterial color="#7a4a25" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.85, 1.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <coneGeometry args={[0.55, 1.0, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Rock({ x, z, scale, color }: { x: number; z: number; scale: number; color: string }) {
  return (
    <mesh position={[x, scale * 0.25, z]} scale={[scale, scale * 0.7, scale]} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Flower({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#3a8a3a" />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function Campfire({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.scale.y = 1 + Math.sin(s.clock.elapsedTime * 8) * 0.15;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 18]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.4, 0.1, Math.sin(i * Math.PI / 2) * 0.4]} rotation={[0, 0, i * Math.PI / 4]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 5]} />
          <meshStandardMaterial color="#5b3a1f" />
        </mesh>
      ))}
      <mesh ref={ref} position={[0, 0.45, 0]}>
        <coneGeometry args={[0.25, 0.7, 6]} />
        <meshStandardMaterial color="#ff7a2a" emissive="#ff5a1a" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#ff7a2a" intensity={1.2} distance={6} />
    </group>
  );
}

function LavaPool({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(s.clock.elapsedTime * 2) * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={[x, 0.2, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.4, 24]} />
      <meshStandardMaterial color="#ff6b1a" emissive="#ff4a1a" emissiveIntensity={0.8} />
    </mesh>
  );
}

function IslandHut({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 1, 8]} />
        <meshStandardMaterial color="#caa066" />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[1.6, 1.0, 8]} />
        <meshStandardMaterial color="#5a8a4a" />
      </mesh>
    </group>
  );
}

function VoidShrine({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.2, 0.8, 6]} />
        <meshStandardMaterial color="#3a1a3a" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#9b8aff" emissive="#6b3dff" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 1.7, 0]} color="#6b3dff" intensity={1.0} distance={5} />
    </group>
  );
}

function CloudIsland({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[1.6, 16, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.6, 0]}>
        <sphereGeometry args={[1.2, 12, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.5, 0.6, 0.4]}>
        <sphereGeometry args={[1.0, 12, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function PortalMarker({ x, z, color }: { x: number; z: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.6;
  });
  return (
    <group ref={ref} position={[x, 0, z]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <torusGeometry args={[1.0, 0.16, 12, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <ringGeometry args={[0.85, 0.95, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color={color} intensity={2.0} distance={8} />
      {/* Base */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.4, 24]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
    </group>
  );
}

function BossMarker({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.y = 1.5 + Math.sin(s.clock.elapsedTime * 2) * 0.2;
      ref.current.rotation.y = s.clock.elapsedTime;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 1.5, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#ffd83d" emissive="#ff8a3a" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ffd83d" intensity={1.4} distance={8} />
    </group>
  );
}

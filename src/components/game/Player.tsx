import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { isInTallGrass, shouldEncounterHere } from '@/systems/encounter';
import { PLAYER_SPEED } from '@/game/constants';
import { useKeyboard } from '@/hooks/useKeyboard';
import { NPCS } from '@/data/npcs';
import { CHUNK_SIZE, chunkOf, generateChunk, isSpawnChunk } from '@/systems/world';

const WORLD_SEED = 1337;

// Spawn-town-only static colliders (only used in Aetheria within ~32 units of origin)
const SPAWN_COLLIDERS: { x: number; z: number; r: number }[] = [
  { x: -8, z: 4, r: 3.4 },
  { x: -16, z: -8, r: 3.8 },
  { x: 6, z: -2, r: 0.9 },
  { x: 8, z: 0, r: 0.9 },
  { x: 14, z: -4, r: 0.9 },
  { x: -3, z: -10, r: 0.9 },
  { x: 2, z: -8, r: 0.9 },
  { x: 10, z: 8, r: 0.9 },
  { x: -10, z: 12, r: 0.9 },
  { x: 16, z: 14, r: 4 },
  { x: -3, z: 49, r: 0.7 },
  { x: 3, z: 49, r: 0.7 },
];

const NPC_COLLIDERS = NPCS.map((n) => ({ x: n.position[0], z: n.position[2], r: 1.0, npcId: n.id }));

function spawnTownCollision(x: number, z: number): boolean {
  for (const c of SPAWN_COLLIDERS) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.r * c.r) return true;
  }
  return false;
}

function npcAt(x: number, z: number): string | null {
  for (const c of NPC_COLLIDERS) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.r * c.r) return c.npcId;
  }
  return null;
}

interface PlayerProps {
  inputEnabled: boolean;
  onInteractNpc: (npcId: string) => void;
  onPortalTravel: (dim: string) => void;
  onBossEncounter: (speciesId: string, level: number, bossId: string) => void;
}

export default function Player({ inputEnabled, onInteractNpc, onPortalTravel, onBossEncounter }: PlayerProps) {
  const ref = useRef<THREE.Group>(null);
  const grassTimer = useRef(0);
  const lastInteractTriggered = useRef(false);
  const lastPortalTriggered = useRef<string | null>(null);
  const lastBossTriggered = useRef<string | null>(null);
  const { camera } = useThree();
  const keys = useKeyboard();
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const startWildEncounterAt = useGameStore((s) => s.startWildEncounterAt);
  const playerPos = useGameStore((s) => s.player.position);
  const playerFacing = useGameStore((s) => s.player.facing);
  const dimension = useGameStore((s) => s.player.dimension);
  const defeatedBosses = useGameStore((s) => s.player.defeatedBosses);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(playerPos[0], playerPos[1], playerPos[2]);
      ref.current.rotation.y = playerFacing;
    }
  }, [playerPos[0], playerPos[2], dimension]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (screen !== 'overworld') return;

    let moveX = 0;
    let moveZ = 0;
    if (inputEnabled) {
      if (keys.up) moveZ -= 1;
      if (keys.down) moveZ += 1;
      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;
    }
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }
    const speed = PLAYER_SPEED * delta;
    const curX = ref.current.position.x;
    const curZ = ref.current.position.z;
    let newX = curX + moveX * speed;
    let newZ = curZ + moveZ * speed;

    // Spawn-town legacy colliders only in Aetheria origin chunks
    if (dimension === 'aetheria' && Math.abs(newX) < 32 && Math.abs(newZ) < 32) {
      if (spawnTownCollision(newX, curZ)) newX = curX;
      if (spawnTownCollision(curX, newZ)) newZ = curZ;
    }

    let facing = playerFacing;
    if (len > 0) {
      facing = Math.atan2(moveX, moveZ);
      ref.current.rotation.y = facing;
    }
    ref.current.position.x = newX;
    ref.current.position.z = newZ;

    // Camera follow
    const camTargetX = newX;
    const camTargetZ = newZ + 9;
    camera.position.x += (camTargetX - camera.position.x) * Math.min(1, delta * 5);
    camera.position.z += (camTargetZ - camera.position.z) * Math.min(1, delta * 5);
    camera.position.y = 8;
    camera.lookAt(newX, 1.5, newZ);

    if (len > 0) {
      ref.current.position.y = Math.abs(Math.sin(performance.now() * 0.012)) * 0.12;
    } else {
      ref.current.position.y *= 0.85;
    }

    if (Math.abs(newX - playerPos[0]) > 0.05 || Math.abs(newZ - playerPos[2]) > 0.05) {
      setPlayerPosition(newX, 0, newZ, facing);
    }

    // Encounter trigger
    if (len > 0) {
      // Spawn-town tall grass area always triggers (legacy)
      if (dimension === 'aetheria' && isInTallGrass(newX, newZ)) {
        grassTimer.current += delta * len;
        if (grassTimer.current > 0.4) {
          grassTimer.current = 0;
          if (Math.random() < 0.18) {
            startWildEncounterAt(newX, newZ);
            return;
          }
        }
      } else {
        // Procedural biome encounters
        const { rate } = shouldEncounterHere(dimension as any, newX, newZ);
        if (rate > 0) {
          grassTimer.current += delta * len;
          if (grassTimer.current > 0.6) {
            grassTimer.current = 0;
            if (Math.random() < rate) {
              startWildEncounterAt(newX, newZ);
              return;
            }
          }
        }
      }
    } else {
      grassTimer.current = 0;
    }

    // Portal & Boss proximity (current chunk only)
    const { cx, cy } = chunkOf(newX, newZ);
    if (!isSpawnChunk(dimension as any, cx, cy)) {
      const ch = generateChunk(dimension as any, cx, cy, WORLD_SEED);

      // Portals
      let nearPortal: string | null = null;
      for (const p of ch.portals) {
        const dx = newX - p.x;
        const dz = newZ - p.z;
        if (dx * dx + dz * dz < 1.4 * 1.4) {
          nearPortal = p.dimension;
          if (lastPortalTriggered.current !== p.dimension) {
            lastPortalTriggered.current = p.dimension;
            onPortalTravel(p.dimension);
            return;
          }
          break;
        }
      }
      if (!nearPortal) lastPortalTriggered.current = null;

      // Boss
      if (ch.boss && !defeatedBosses.includes(ch.boss.bossId)) {
        const dx = newX - ch.boss.x;
        const dz = newZ - ch.boss.z;
        if (dx * dx + dz * dz < 1.4 * 1.4) {
          if (lastBossTriggered.current !== ch.boss.bossId) {
            lastBossTriggered.current = ch.boss.bossId;
            onBossEncounter(ch.boss.speciesId, ch.boss.level, ch.boss.bossId);
            return;
          }
        } else {
          lastBossTriggered.current = null;
        }
      }
    }

    // NPC adjacency for prompt (only in Aetheria spawn area)
    if (dimension === 'aetheria') {
      const adj = npcAt(newX, newZ + Math.cos(facing) * 1.0);
      if (inputEnabled && keys.interact) {
        if (adj && !lastInteractTriggered.current) {
          lastInteractTriggered.current = true;
          onInteractNpc(adj);
        }
      } else {
        lastInteractTriggered.current = false;
      }
    }
  });

  return (
    <group ref={ref} position={playerPos}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.55, 6, 12]} />
        <meshStandardMaterial color="#3aa6ff" />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#f5d2a0" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.18, 16]} />
        <meshStandardMaterial color="#dc3838" />
      </mesh>
      <mesh position={[0, 1.36, 0.32]}>
        <boxGeometry args={[0.5, 0.06, 0.18]} />
        <meshStandardMaterial color="#dc3838" />
      </mesh>
      <mesh position={[-0.1, 1.22, 0.28]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.1, 1.22, 0.28]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.65, -0.3]} castShadow>
        <boxGeometry args={[0.36, 0.42, 0.18]} />
        <meshStandardMaterial color="#7a4a25" />
      </mesh>
    </group>
  );
}

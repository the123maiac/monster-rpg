import { Canvas, useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import ChunkedWorld from './ChunkedWorld';
import SpawnTown from './SpawnTown';
import Player from './Player';
import NPC from './NPC';
import Weather from './Weather';
import DimensionFx from './DimensionFx';
import { NPCS } from '@/data/npcs';
import { useEffect, useMemo, useRef } from 'react';
import { atmosphereAt, useTimeWeather } from '@/systems/timeWeather';
import { inputState } from '@/systems/input';
import { DIMENSIONS } from '@/data/dimensions';
import * as THREE from 'three';

function DynamicAtmosphere() {
  const tick = useTimeWeather((s) => s.tick);
  const t = useTimeWeather((s) => s.timeOfDay);
  const dimension = useGameStore((s) => s.player.dimension);
  const dimCfg = DIMENSIONS[dimension];
  const atmos = useMemo(() => {
    const base = atmosphereAt(t);
    // Tint by dimension
    return {
      ...base,
      fogColor: dimension === 'aetheria' ? base.fogColor : dimCfg.fog,
      ambientColor: dimension === 'aetheria' ? base.ambientColor : dimCfg.ambient,
    };
  }, [t, dimension, dimCfg]);

  useFrame((_, dt) => {
    tick(dt);
  });

  return (
    <>
      <color attach="background" args={[atmos.fogColor]} />
      <fog attach="fog" args={[atmos.fogColor, 25, 80]} />
      <ambientLight intensity={atmos.ambientIntensity} color={atmos.ambientColor} />
      <directionalLight
        position={atmos.sunPos}
        intensity={atmos.directionalIntensity}
        color={atmos.directionalColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={[atmos.hemisphereSky, atmos.hemisphereGround, 0.4]} />
      {atmos.isNight && <Stars />}
    </>
  );
}

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const r = 60 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.4;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) + 5;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.005;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#ffffff" sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

export default function Overworld() {
  const startDialogue = useGameStore((s) => s.startDialogue);
  const setScreen = useGameStore((s) => s.setScreen);
  const player = useGameStore((s) => s.player);
  const screen = useGameStore((s) => s.screen);
  const dialogueActive = useGameStore((s) => s.dialogue.active);
  const startTrainerBattle = useGameStore((s) => s.startTrainerBattle);
  const startBossBattle = useGameStore((s) => s.startBossBattle);
  const markNpcTriggered = useGameStore((s) => s.markNpcTriggered);
  const startQuest = useGameStore((s) => s.startQuest);
  const advanceQuest = useGameStore((s) => s.advanceQuest);
  const travelToDimension = useGameStore((s) => s.travelToDimension);

  const inputEnabled = screen === 'overworld' && !dialogueActive;
  const dimension = player.dimension;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'overworld') return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setScreen('pause');
      }
      if (e.code === 'KeyC') {
        e.preventDefault();
        setScreen('party');
      }
      if (e.code === 'KeyQ') {
        e.preventDefault();
        setScreen('quests');
      }
      if (e.code === 'KeyI') {
        e.preventDefault();
        setScreen('inventory');
      }
    };
    window.addEventListener('keydown', onKey);
    let prevMenu = false;
    const id = setInterval(() => {
      const cur = inputState.menu;
      if (cur && !prevMenu && useGameStore.getState().screen === 'overworld') {
        setScreen('pause');
      }
      prevMenu = cur;
    }, 100);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(id);
    };
  }, [screen, setScreen]);

  const handleInteract = (npcId: string) => {
    if (dialogueActive) return;
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return;
    const isDefeatedTrainer = npc.isTrainer && npc.trainerId && player.defeatedTrainers.includes(npc.trainerId);
    const lines = isDefeatedTrainer
      ? npc.postBattleDialogue ?? ['…']
      : npc.dialogue;
    const onComplete = () => {
      if (npc.isTrainer && npc.trainerId && !isDefeatedTrainer) {
        startQuest('q_trainer');
        startTrainerBattle(npc.trainerId);
        return;
      }
      if (npc.id === 'professor' && player.party.length === 0) {
        setScreen('starter-selection');
        return;
      }
      if (npc.id === 'questGiver') {
        startQuest('q_capture');
        if (player.party.length > 1 || player.storage.length > 0) {
          advanceQuest('q_capture', 1);
        }
      }
      markNpcTriggered(npc.id);
    };
    startDialogue(npc.id, lines, npc.name, onComplete);
  };

  const handlePortal = (dim: string) => {
    travelToDimension(dim as any);
  };

  const handleBoss = (speciesId: string, level: number, bossId: string) => {
    startBossBattle(speciesId, level, bossId);
  };

  return (
    <Canvas
      shadows
      camera={{ position: [player.position[0], 8, player.position[2] + 9], fov: 55 }}
      gl={{ antialias: true }}
    >
      <DynamicAtmosphere />
      {dimension === 'aetheria' && <SpawnTown />}
      <ChunkedWorld />
      {dimension === 'aetheria' && NPCS.map((n) => {
        const isDefeated = !!(n.isTrainer && n.trainerId && player.defeatedTrainers.includes(n.trainerId));
        return <NPC key={n.id} data={n} defeated={isDefeated} />;
      })}
      <Player
        inputEnabled={inputEnabled}
        onInteractNpc={handleInteract}
        onPortalTravel={handlePortal}
        onBossEncounter={handleBoss}
      />
      <Weather />
      <DimensionFx />
    </Canvas>
  );
}

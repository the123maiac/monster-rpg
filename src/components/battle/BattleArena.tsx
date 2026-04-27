import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import Creature3D from '@/components/game/Creature3D';
import { useGameStore } from '@/store/gameStore';

function ParticleBurst({ origin, color, active }: { origin: [number, number, number]; color: string; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [particles] = useState(() =>
    Array.from({ length: 18 }, () => ({
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      vz: (Math.random() - 0.5) * 4,
      life: 1.0,
    }))
  );
  const startTime = useRef(0);
  useEffect(() => {
    if (active) startTime.current = performance.now();
  }, [active]);
  useFrame(() => {
    if (!groupRef.current || !active) return;
    const elapsed = (performance.now() - startTime.current) / 1000;
    groupRef.current.children.forEach((c, i) => {
      const p = particles[i];
      c.position.set(origin[0] + p.vx * elapsed, origin[1] + p.vy * elapsed - 4 * elapsed * elapsed, origin[2] + p.vz * elapsed);
      const lifeLeft = Math.max(0, 1 - elapsed);
      c.scale.setScalar(0.15 * lifeLeft);
      (c as THREE.Mesh).visible = elapsed < 1.0;
    });
  });
  if (!active) return null;
  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.5, 6, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function BattleArena() {
  const battle = useGameStore((s) => s.battle);
  if (!battle) return null;

  const playerHpRatio = battle.player.currentHp / battle.player.maxHp;
  const enemyHpRatio = battle.enemy.currentHp / battle.enemy.maxHp;
  const phase = battle.phase;

  return (
    <Canvas camera={{ position: [0, 4, 9], fov: 50 }} gl={{ antialias: true }}>
      <color attach="background" args={['#1a2440']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.3} />
      <hemisphereLight args={['#fff3a3', '#3aa6ff', 0.3]} />
      <fog attach="fog" args={['#1a2440', 12, 26]} />

      {/* Battle ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 36]} />
        <meshStandardMaterial color="#3a5a3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.05, 2]} receiveShadow>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color="#5a8a4a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.05, -2]} receiveShadow>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color="#5a8a4a" />
      </mesh>

      {/* Player creature (left, foreground) */}
      <group
        position={[-3.5, 0.6, 2]}
        scale={[1.3, 1.3, 1.3]}
      >
        <Creature3D
          speciesId={battle.player.speciesId}
          shiny={battle.player.shiny}
          facing={Math.PI * 0.25}
        />
      </group>

      {/* Enemy creature (right, background) */}
      <group
        position={[3.5, 0.7, -2]}
        scale={[1.05, 1.05, 1.05]}
      >
        <Creature3D
          speciesId={battle.enemy.speciesId}
          shiny={battle.enemy.shiny}
          facing={-Math.PI * 0.25 + Math.PI}
        />
      </group>

      {/* Particle attack hits */}
      <ParticleBurst origin={[3.5, 1.2, -2]} color="#ffd83d" active={battle.attackerFlash === 'player'} />
      <ParticleBurst origin={[-3.5, 1.2, 2]} color="#ff5a5a" active={battle.attackerFlash === 'enemy'} />

      <CameraShake shake={battle.shake} attacker={battle.attackerFlash} />
    </Canvas>
  );
}

function CameraShake({ shake, attacker }: { shake: boolean; attacker: 'player' | 'enemy' | null }) {
  useFrame(({ camera }, dt) => {
    // Target position based on attacker (push-in toward attacker)
    let tx = 0;
    let ty = 4;
    let tz = 9;
    if (attacker === 'player') {
      tx = -1.5;
      ty = 3.2;
      tz = 6.5;
    } else if (attacker === 'enemy') {
      tx = 1.5;
      ty = 3.2;
      tz = 6.5;
    }
    if (shake) {
      tx += Math.sin(performance.now() * 0.05) * 0.25;
      ty += Math.cos(performance.now() * 0.06) * 0.18;
    }
    const k = Math.min(1, dt * 6);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(0, 1, 0);
  });
  return null;
}

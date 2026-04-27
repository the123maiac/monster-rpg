import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CHUNK_SIZE, RENDER_RADIUS, chunkOf, generateChunk, isSpawnChunk } from '@/systems/world';
import Chunk from './Chunk';

const WORLD_SEED = 1337;

export default function ChunkedWorld() {
  const dimension = useGameStore((s) => s.player.dimension);
  const playerPos = useGameStore((s) => s.player.position);
  const defeatedBosses = useGameStore((s) => s.player.defeatedBosses);

  const { cx: pcx, cy: pcy } = chunkOf(playerPos[0], playerPos[2]);

  const chunks = useMemo(() => {
    const list = [];
    for (let dy = -RENDER_RADIUS; dy <= RENDER_RADIUS; dy++) {
      for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
        const cx = pcx + dx;
        const cy = pcy + dy;
        if (isSpawnChunk(dimension, cx, cy)) continue; // hand-crafted town renders separately
        const ch = generateChunk(dimension, cx, cy, WORLD_SEED);
        if (ch.boss && defeatedBosses.includes(ch.boss.bossId)) {
          ch.boss.defeated = true;
        }
        list.push(ch);
      }
    }
    return list;
  }, [dimension, pcx, pcy, defeatedBosses]);

  return (
    <group>
      {chunks.map((ch) => (
        <Chunk key={`${dimension}-${ch.cx}-${ch.cy}`} chunk={ch} />
      ))}
    </group>
  );
}

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { NPCS } from '@/data/npcs';
import { timeLabel, useTimeWeather } from '@/systems/timeWeather';
import { CHUNK_SIZE, chunkOf, generateChunk, isSpawnChunk } from '@/systems/world';
import { DIMENSIONS } from '@/data/dimensions';

const SIZE = 150;
const VIEW_CHUNKS = 5; // chunks across the mini-map

const WORLD_SEED = 1337;

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useGameStore((s) => s.player);
  const t = useTimeWeather((s) => s.timeOfDay);
  const weather = useTimeWeather((s) => s.weather);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0e1320';
    ctx.fillRect(0, 0, w, h);

    const dim = player.dimension;
    const px = player.position[0];
    const pz = player.position[2];
    const { cx: pcx, cy: pcy } = chunkOf(px, pz);
    const cellSize = w / VIEW_CHUNKS;
    const half = (VIEW_CHUNKS - 1) / 2;

    for (let dy = -Math.ceil(half); dy <= Math.ceil(half); dy++) {
      for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
        const cx = pcx + dx;
        const cy = pcy + dy;
        if (isSpawnChunk(dim, cx, cy)) {
          // Draw town square
          const px0 = (dx + half) * cellSize;
          const py0 = (dy + half) * cellSize;
          ctx.fillStyle = '#88c66a';
          ctx.fillRect(px0, py0, cellSize, cellSize);
          ctx.fillStyle = '#a64a4a';
          ctx.fillRect(px0 + cellSize * 0.2, py0 + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);
          continue;
        }
        const ch = generateChunk(dim, cx, cy, WORLD_SEED);
        const px0 = (dx + half) * cellSize;
        const py0 = (dy + half) * cellSize;
        ctx.fillStyle = ch.biome.ground;
        ctx.fillRect(px0, py0, cellSize + 1, cellSize + 1);
        // Markers
        if (ch.boss && !player.defeatedBosses.includes(ch.boss.bossId)) {
          ctx.fillStyle = '#ffd83d';
          ctx.beginPath();
          ctx.arc(px0 + cellSize / 2, py0 + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const portal of ch.portals) {
          ctx.fillStyle = portal.color;
          ctx.beginPath();
          ctx.arc(px0 + cellSize / 2, py0 + cellSize / 2, cellSize * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Player position dot (centered)
    const ang = player.facing;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-ang);
    ctx.fillStyle = '#3aa6ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // NPCs visible in spawn town
    if (dim === 'aetheria') {
      for (const n of NPCS) {
        const dx = n.position[0] - px;
        const dz = n.position[2] - pz;
        const sx = w / 2 + (dx / (CHUNK_SIZE * VIEW_CHUNKS)) * w;
        const sy = h / 2 + (dz / (CHUNK_SIZE * VIEW_CHUNKS)) * h;
        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
        const isDefeated = n.isTrainer && n.trainerId && player.defeatedTrainers.includes(n.trainerId);
        ctx.fillStyle = n.isTrainer && !isDefeated ? '#ff5a5a' : '#fff3a3';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Border
    ctx.strokeStyle = '#fff3';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, [player.position[0], player.position[2], player.facing, player.defeatedBosses, player.defeatedTrainers, player.dimension]);

  const weatherIcon = weather === 'rain' ? '☔' : weather === 'leaves' ? '🍂' : '☀';
  const dimCfg = DIMENSIONS[player.dimension];
  const { cx, cy } = chunkOf(player.position[0], player.position[2]);

  return (
    <div className="absolute top-3 right-3 pointer-events-none flex flex-col items-end gap-1.5">
      <div className="panel p-1.5 pointer-events-auto">
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded" />
      </div>
      <div className="panel px-2 py-1 text-xs pointer-events-auto flex items-center gap-2">
        <span className="text-amber-200">{weatherIcon}</span>
        <span className="text-white/80">{timeLabel(t)}</span>
      </div>
      <div className="panel px-2 py-1 text-xs pointer-events-auto">
        <span className="text-white/50">Dim:</span>{' '}
        <span className="text-amber-200 font-display font-semibold">{dimCfg.name}</span>
      </div>
      <div className="panel px-2 py-1 text-[10px] pointer-events-auto text-white/60 font-mono">
        ({cx}, {cy})
      </div>
    </div>
  );
}

import { BIOMES, DIMENSIONS, PORTALS, biomeAt } from '@/data/dimensions';
import type { BiomeConfig, BiomeId, DimensionId } from '@/data/dimensions';
import { chunkRng, hash2 } from './noise';

export const CHUNK_SIZE = 32;
export const RENDER_RADIUS = 3; // chunks around player

export interface ChunkFeature {
  type: 'tree' | 'rock' | 'flower' | 'grass';
  x: number;
  z: number;
  scale: number;
  variation: number;
}

export interface ChunkStructure {
  type: 'campfire' | 'shrine' | 'lavapool' | 'islandhut' | 'voidshrine' | 'cloud_island';
  x: number;
  z: number;
  rotation: number;
}

export interface ChunkBoss {
  speciesId: string;
  level: number;
  x: number;
  z: number;
  bossId: string; // unique deterministic id
  defeated?: boolean;
}

export interface ChunkPortal {
  dimension: DimensionId;
  color: string;
  name: string;
  x: number;
  z: number;
}

export interface ChunkData {
  cx: number;
  cy: number;
  centerX: number;
  centerZ: number;
  biome: BiomeConfig;
  features: ChunkFeature[];
  structures: ChunkStructure[];
  boss?: ChunkBoss;
  portals: ChunkPortal[];
  // Procedural quest seed: spawn rate of "rare" creature for that chunk
  rareSpeciesId?: string;
}

const SPAWN_TOWN_RADIUS = 1; // chunks around (0,0) of aetheria where the hand-built town renders separately

export function isSpawnChunk(dim: DimensionId, cx: number, cy: number): boolean {
  return dim === 'aetheria' && Math.abs(cx) <= SPAWN_TOWN_RADIUS - 1 && Math.abs(cy) <= SPAWN_TOWN_RADIUS - 1;
}

export function getChunkBiome(dim: DimensionId, cx: number, cy: number, seed: number): BiomeConfig {
  const dimCfg = DIMENSIONS[dim];
  // Sample center of chunk
  const wx = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const wy = cy * CHUNK_SIZE + CHUNK_SIZE / 2;
  const id = biomeAt(wx, wy, dimCfg, seed);
  return BIOMES[id];
}

export function generateChunk(dim: DimensionId, cx: number, cy: number, seed: number): ChunkData {
  const biome = getChunkBiome(dim, cx, cy, seed);
  const rng = chunkRng(cx, cy, seed);
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cy * CHUNK_SIZE;

  const features: ChunkFeature[] = [];
  const structures: ChunkStructure[] = [];

  const target = (count: number) => Math.max(0, Math.floor(count + (rng() - 0.5) * 3));
  const sampleXY = () => [centerX + rng() * CHUNK_SIZE, centerZ + rng() * CHUNK_SIZE];

  // Trees
  const tCount = target(biome.density.tree * CHUNK_SIZE * 0.4);
  for (let i = 0; i < tCount; i++) {
    const [x, z] = sampleXY();
    features.push({ type: 'tree', x, z, scale: 0.9 + rng() * 0.5, variation: Math.floor(rng() * 3) });
  }
  // Rocks
  const rCount = target(biome.density.rock * CHUNK_SIZE * 0.4);
  for (let i = 0; i < rCount; i++) {
    const [x, z] = sampleXY();
    features.push({ type: 'rock', x, z, scale: 0.6 + rng() * 0.6, variation: Math.floor(rng() * 3) });
  }
  // Grass tufts (only on tallgrass / ember / glow)
  if (biome.density.grass > 0) {
    const gCount = Math.floor(biome.density.grass * 30);
    for (let i = 0; i < gCount; i++) {
      const [x, z] = sampleXY();
      features.push({ type: 'grass', x, z, scale: 0.5 + rng() * 0.7, variation: rng() });
    }
  }
  // Flowers
  if (biome.density.flower > 0 && biome.flowerPalette.length > 0) {
    const fCount = Math.floor(biome.density.flower * 20);
    for (let i = 0; i < fCount; i++) {
      const [x, z] = sampleXY();
      features.push({ type: 'flower', x, z, scale: 0.8 + rng() * 0.4, variation: Math.floor(rng() * biome.flowerPalette.length) });
    }
  }

  // Structures: campfire on every ~6th chunk in safe biomes
  if (rng() < 0.12 && !biome.isHazard && !biome.isWater) {
    structures.push({ type: 'campfire', x: centerX + 16 + (rng() - 0.5) * 8, z: centerZ + 16 + (rng() - 0.5) * 8, rotation: rng() * Math.PI * 2 });
  }
  // Dimension-specific structures
  if (dim === 'emberreach' && biome.id === 'lava' && rng() < 0.5) {
    structures.push({ type: 'lavapool', x: centerX + 16 + (rng() - 0.5) * 6, z: centerZ + 16 + (rng() - 0.5) * 6, rotation: 0 });
  }
  if (dim === 'tidewell' && biome.id === 'isle' && rng() < 0.3) {
    structures.push({ type: 'islandhut', x: centerX + 16 + (rng() - 0.5) * 8, z: centerZ + 16 + (rng() - 0.5) * 8, rotation: rng() * Math.PI * 2 });
  }
  if (dim === 'voidspire' && biome.id === 'ruin' && rng() < 0.4) {
    structures.push({ type: 'voidshrine', x: centerX + 16 + (rng() - 0.5) * 8, z: centerZ + 16 + (rng() - 0.5) * 8, rotation: rng() * Math.PI * 2 });
  }
  if (dim === 'skyloft' && rng() < 0.3) {
    structures.push({ type: 'cloud_island', x: centerX + 16 + (rng() - 0.5) * 6, z: centerZ + 16 + (rng() - 0.5) * 6, rotation: 0 });
  }

  // Boss: rare, deterministic. ~ 1 in 22 chunks.
  let boss: ChunkBoss | undefined;
  const bossRoll = hash2(cx, cy, seed ^ 0xb055);
  if (bossRoll > 0.955 && !isSpawnChunk(dim, cx, cy)) {
    const pool = biome.creaturePool;
    // Boss is the highest-weight rare or the first legendary species in pool, fall back to weighted random
    let chosen = pool.find((p) => p.weight <= 6); // legendary-ish (low weight)
    if (!chosen) chosen = pool[Math.floor(rng() * pool.length)];
    boss = {
      speciesId: chosen.speciesId,
      level: 12 + Math.floor(bossRoll * 18),
      x: centerX + 16,
      z: centerZ + 16,
      bossId: `${dim}_${cx}_${cy}`,
    };
  }

  // Portals (Aetheria spawn area)
  const portals: ChunkPortal[] = [];
  if (dim === 'aetheria') {
    for (const p of PORTALS) {
      if (p.chunkX === cx && p.chunkY === cy) {
        portals.push({
          dimension: p.dimension,
          color: p.color,
          name: p.name,
          x: centerX + 16,
          z: centerZ + 16,
        });
      }
    }
  } else {
    // Each non-Aetheria dimension has a Return Portal at chunk (0,0)
    if (cx === 0 && cy === 0) {
      portals.push({
        dimension: 'aetheria',
        color: '#fff3a3',
        name: 'Return to Aetheria',
        x: centerX + 16,
        z: centerZ + 16,
      });
    }
  }

  return {
    cx,
    cy,
    centerX,
    centerZ,
    biome,
    features,
    structures,
    boss,
    portals,
  };
}

export function chunkOf(worldX: number, worldZ: number) {
  return { cx: Math.floor(worldX / CHUNK_SIZE), cy: Math.floor(worldZ / CHUNK_SIZE) };
}

export function biomeAtWorld(dim: DimensionId, worldX: number, worldZ: number, seed: number): BiomeConfig {
  const { cx, cy } = chunkOf(worldX, worldZ);
  return getChunkBiome(dim, cx, cy, seed);
}

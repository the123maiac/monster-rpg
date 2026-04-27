import { WILD_LEVEL_RANGE } from '@/game/constants';
import { buildInstance } from './stats';
import { biomeAtWorld } from './world';
import type { DimensionId } from '@/data/dimensions';

const WORLD_SEED = 1337;

const ROUTE_POOL: { speciesId: string; weight: number }[] = [
  { speciesId: 'pebblor', weight: 30 },
  { speciesId: 'mudmole', weight: 25 },
  { speciesId: 'breezelle', weight: 18 },
  { speciesId: 'lunacub', weight: 12 },
  { speciesId: 'voltwing', weight: 10 },
  { speciesId: 'glimray', weight: 1 },
];

function pickFromPool(pool: { speciesId: string; weight: number }[]) {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  let pick = pool[0];
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) {
      pick = e;
      break;
    }
  }
  return pick;
}

export function rollWild() {
  const pick = pickFromPool(ROUTE_POOL);
  const [lo, hi] = WILD_LEVEL_RANGE;
  const level = lo + Math.floor(Math.random() * (hi - lo + 1));
  return buildInstance(pick.speciesId, level);
}

// Roll a wild creature based on the biome at the world coordinates
export function rollWildAt(dim: DimensionId, x: number, z: number, playerLevel: number) {
  const biome = biomeAtWorld(dim, x, z, WORLD_SEED);
  const pick = pickFromPool(biome.creaturePool);
  // Level scales with player's strongest level, with biome variance
  const lo = Math.max(2, playerLevel - 2);
  const hi = Math.max(lo + 1, playerLevel + 1);
  const level = lo + Math.floor(Math.random() * (hi - lo + 1));
  return buildInstance(pick.speciesId, level);
}

// Tall-grass tile detection in spawn town (legacy hand-crafted area)
export function isInTallGrass(x: number, z: number): boolean {
  return x > -16 && x < 16 && z > 22 && z < 44;
}

// True if biome at this point should trigger encounters when walked on
export function shouldEncounterHere(dim: DimensionId, x: number, z: number): { rate: number; biomeId: string } {
  const biome = biomeAtWorld(dim, x, z, WORLD_SEED);
  return { rate: biome.encounterRate, biomeId: biome.id };
}

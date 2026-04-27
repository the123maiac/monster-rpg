import type { ElementClass } from '@/types';

export type DimensionId = 'aetheria' | 'emberreach' | 'tidewell' | 'voidspire' | 'skyloft';

export type BiomeId =
  | 'meadow' | 'forest' | 'rocky' | 'wetland' | 'tallgrass'           // aetheria
  | 'ash' | 'lava' | 'ember' | 'obsidian'                              // emberreach
  | 'shore' | 'reef' | 'deep' | 'isle'                                 // tidewell
  | 'void' | 'ruin' | 'glow' | 'shade'                                 // voidspire
  | 'cloud' | 'peak' | 'storm';                                        // skyloft

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  ground: string;
  accent: string;
  treeColor?: string;
  rockColor?: string;
  density: { tree: number; rock: number; grass: number; flower: number };
  flowerPalette: string[];
  isWater?: boolean;
  isHazard?: boolean;
  encounterRate: number;
  // Weighted creature pool for encounters
  creaturePool: { speciesId: string; weight: number }[];
}

export interface DimensionConfig {
  id: DimensionId;
  name: string;
  short: string;
  description: string;
  // Sky tint and ambient
  skyTop: string;
  skyHorizon: string;
  fog: string;
  ambient: string;
  // Default biome to use on the field; biomes are picked by 2D noise
  biomes: BiomeId[];
  // Creature emoji-ish element
  primaryElement: ElementClass;
  unlockNote: string;
  // Per-chunk procedural feature scale
  scale: number;
}

const POOL_AETHERIA = [
  { speciesId: 'pebblor', weight: 30 },
  { speciesId: 'mudmole', weight: 22 },
  { speciesId: 'breezelle', weight: 18 },
  { speciesId: 'lunacub', weight: 12 },
  { speciesId: 'voltwing', weight: 10 },
  { speciesId: 'glimray', weight: 1 },
];

const POOL_EMBERREACH = [
  { speciesId: 'emberkit', weight: 22 },
  { speciesId: 'flametail', weight: 14 },
  { speciesId: 'cinderbeast', weight: 18 },
  { speciesId: 'magmacore', weight: 4 },
  { speciesId: 'pebblor', weight: 12 },
  { speciesId: 'mudmole', weight: 10 },
];

const POOL_TIDEWELL = [
  { speciesId: 'aquabun', weight: 24 },
  { speciesId: 'shellfin', weight: 14 },
  { speciesId: 'tidalwyrm', weight: 10 },
  { speciesId: 'reefshade', weight: 14 },
  { speciesId: 'breezelle', weight: 14 },
  { speciesId: 'mossprout', weight: 12 },
];

const POOL_VOIDSPIRE = [
  { speciesId: 'lunacub', weight: 26 },
  { speciesId: 'spectrelle', weight: 16 },
  { speciesId: 'voidwraith', weight: 5 },
  { speciesId: 'glimray', weight: 18 },
  { speciesId: 'breezelle', weight: 12 },
];

const POOL_SKYLOFT = [
  { speciesId: 'breezelle', weight: 30 },
  { speciesId: 'voltwing', weight: 22 },
  { speciesId: 'cumulon', weight: 18 },
  { speciesId: 'stormcrest', weight: 6 },
  { speciesId: 'glimray', weight: 8 },
];

export const BIOMES: Record<BiomeId, BiomeConfig> = {
  // Aetheria
  meadow: { id: 'meadow', name: 'Meadow', ground: '#88c66a', accent: '#a3e08c', density: { tree: 0.05, rock: 0.04, grass: 0.0, flower: 0.18 }, flowerPalette: ['#ff6b8e', '#ffd83d', '#9bd9a3', '#ffffff'], encounterRate: 0.04, creaturePool: POOL_AETHERIA },
  forest: { id: 'forest', name: 'Forest', ground: '#5a8a4a', accent: '#6aaa55', treeColor: '#3aa14c', density: { tree: 0.42, rock: 0.05, grass: 0.0, flower: 0.05 }, flowerPalette: ['#fff', '#c98aff'], encounterRate: 0.06, creaturePool: POOL_AETHERIA },
  rocky: { id: 'rocky', name: 'Rocky Steppe', ground: '#a89578', accent: '#8a7560', rockColor: '#7a6a55', density: { tree: 0.04, rock: 0.32, grass: 0.0, flower: 0.02 }, flowerPalette: ['#ffd83d'], encounterRate: 0.05, creaturePool: POOL_AETHERIA },
  wetland: { id: 'wetland', name: 'Wetland', ground: '#5d8a8e', accent: '#3aa6ff', isWater: true, density: { tree: 0.06, rock: 0.04, grass: 0.0, flower: 0.08 }, flowerPalette: ['#a3e8ff', '#ffffff'], encounterRate: 0.07, creaturePool: POOL_TIDEWELL },
  tallgrass: { id: 'tallgrass', name: 'Tall Grass', ground: '#6aaa55', accent: '#4d8a3a', density: { tree: 0.04, rock: 0.04, grass: 0.7, flower: 0.06 }, flowerPalette: ['#fff', '#ffd83d', '#ff6b8e'], encounterRate: 0.18, creaturePool: POOL_AETHERIA },

  // Emberreach
  ash: { id: 'ash', name: 'Ashen Plains', ground: '#5a4a4a', accent: '#7a5a5a', density: { tree: 0.02, rock: 0.18, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.06, creaturePool: POOL_EMBERREACH },
  lava: { id: 'lava', name: 'Lava Flow', ground: '#9b3a1a', accent: '#ff6b3d', isHazard: true, density: { tree: 0.0, rock: 0.05, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.04, creaturePool: POOL_EMBERREACH },
  ember: { id: 'ember', name: 'Ember Glade', ground: '#7a3a2a', accent: '#ff8a3a', density: { tree: 0.18, rock: 0.08, grass: 0.4, flower: 0.04 }, flowerPalette: ['#ffd83d', '#ff6b3d'], treeColor: '#a64a2a', encounterRate: 0.14, creaturePool: POOL_EMBERREACH },
  obsidian: { id: 'obsidian', name: 'Obsidian Peaks', ground: '#1a1a2a', accent: '#2a2a3a', rockColor: '#0a0a1a', density: { tree: 0.0, rock: 0.32, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.08, creaturePool: POOL_EMBERREACH },

  // Tidewell
  shore: { id: 'shore', name: 'Sandy Shore', ground: '#f0d89a', accent: '#fff3a3', density: { tree: 0.06, rock: 0.06, grass: 0.04, flower: 0.04 }, flowerPalette: ['#ffd83d', '#a3e8ff'], encounterRate: 0.05, creaturePool: POOL_TIDEWELL },
  reef: { id: 'reef', name: 'Coral Reef', ground: '#3aa6c4', accent: '#a3e8ff', isWater: true, density: { tree: 0.0, rock: 0.12, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.1, creaturePool: POOL_TIDEWELL },
  deep: { id: 'deep', name: 'Deep Tides', ground: '#1a4a8c', accent: '#3aa6ff', isWater: true, density: { tree: 0.0, rock: 0.04, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.12, creaturePool: POOL_TIDEWELL },
  isle: { id: 'isle', name: 'Verdant Isle', ground: '#5fc56e', accent: '#a3e08c', density: { tree: 0.22, rock: 0.06, grass: 0.18, flower: 0.12 }, flowerPalette: ['#ff6b8e', '#fff', '#ffd83d'], encounterRate: 0.1, creaturePool: POOL_TIDEWELL },

  // Voidspire
  void: { id: 'void', name: 'Void Expanse', ground: '#1a0a2a', accent: '#3a1a4a', density: { tree: 0.0, rock: 0.06, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.08, creaturePool: POOL_VOIDSPIRE },
  ruin: { id: 'ruin', name: 'Forgotten Ruin', ground: '#3a2a4a', accent: '#5a3a6a', rockColor: '#2a1a3a', density: { tree: 0.04, rock: 0.32, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.1, creaturePool: POOL_VOIDSPIRE },
  glow: { id: 'glow', name: 'Glowmoss Vale', ground: '#2a4a5a', accent: '#7be0c4', density: { tree: 0.18, rock: 0.06, grass: 0.4, flower: 0.16 }, flowerPalette: ['#7be0c4', '#a3e8ff', '#fff'], treeColor: '#2a8a6a', encounterRate: 0.12, creaturePool: POOL_VOIDSPIRE },
  shade: { id: 'shade', name: 'Shadewood', ground: '#1a2a3a', accent: '#2a3a4a', density: { tree: 0.42, rock: 0.06, grass: 0.0, flower: 0.04 }, flowerPalette: ['#6b3dff'], treeColor: '#2a1a3a', encounterRate: 0.14, creaturePool: POOL_VOIDSPIRE },

  // Skyloft
  cloud: { id: 'cloud', name: 'Cloudfields', ground: '#cfeaff', accent: '#ffffff', density: { tree: 0.02, rock: 0.0, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.08, creaturePool: POOL_SKYLOFT },
  peak: { id: 'peak', name: 'Sky Peak', ground: '#dde6f0', accent: '#a3c0ff', rockColor: '#7a8aa0', density: { tree: 0.0, rock: 0.28, grass: 0.0, flower: 0.04 }, flowerPalette: ['#fff'], encounterRate: 0.09, creaturePool: POOL_SKYLOFT },
  storm: { id: 'storm', name: 'Stormveil', ground: '#5a6a8a', accent: '#3a4a6a', density: { tree: 0.0, rock: 0.06, grass: 0.0, flower: 0.0 }, flowerPalette: [], encounterRate: 0.14, creaturePool: POOL_SKYLOFT },
};

export const DIMENSIONS: Record<DimensionId, DimensionConfig> = {
  aetheria: {
    id: 'aetheria',
    name: 'Aetheria',
    short: 'Overworld',
    description: 'The verdant home of Companions. Rolling meadows, dense forests, and quiet wetlands.',
    skyTop: '#3a86c4', skyHorizon: '#bde3ff', fog: '#bde3ff', ambient: '#fff7d9',
    biomes: ['meadow', 'forest', 'rocky', 'wetland', 'tallgrass'],
    primaryElement: 'Leaf',
    unlockNote: 'Always available.',
    scale: 0.06,
  },
  emberreach: {
    id: 'emberreach',
    name: 'Emberreach',
    short: 'Volcanic',
    description: 'A scorched land of ash plains and slow-flowing lava. Home to the fierce Magmacore.',
    skyTop: '#5a1a2a', skyHorizon: '#ff8a3a', fog: '#a64a2a', ambient: '#ffba60',
    biomes: ['ash', 'lava', 'ember', 'obsidian'],
    primaryElement: 'Flame',
    unlockNote: 'Reach via the Crimson Portal in Aetheria.',
    scale: 0.07,
  },
  tidewell: {
    id: 'tidewell',
    name: 'Tidewell',
    short: 'Ocean',
    description: 'An endless archipelago of bright reefs and verdant isles. Tidalwyrms patrol the deep.',
    skyTop: '#3a6ec4', skyHorizon: '#a3e8ff', fog: '#a3d0ff', ambient: '#bde3ff',
    biomes: ['shore', 'reef', 'deep', 'isle'],
    primaryElement: 'Aqua',
    unlockNote: 'Reach via the Azure Portal in Aetheria.',
    scale: 0.05,
  },
  voidspire: {
    id: 'voidspire',
    name: 'Voidspire',
    short: 'Shadow',
    description: 'A twilight realm of glowing fungus and forgotten ruins. The Voidwraith lurks.',
    skyTop: '#1a0a2a', skyHorizon: '#3a1a4a', fog: '#2a1a3a', ambient: '#7be0c4',
    biomes: ['void', 'ruin', 'glow', 'shade'],
    primaryElement: 'Shadow',
    unlockNote: 'Reach via the Obsidian Portal in Aetheria.',
    scale: 0.05,
  },
  skyloft: {
    id: 'skyloft',
    name: 'Skyloft',
    short: 'Skylands',
    description: 'Floating peaks and roaring storms above the clouds. The Stormcrest watches over all.',
    skyTop: '#5a8ad6', skyHorizon: '#cfeaff', fog: '#cfeaff', ambient: '#ffffff',
    biomes: ['cloud', 'peak', 'storm'],
    primaryElement: 'Wind',
    unlockNote: 'Reach via the Skyborne Portal in Aetheria.',
    scale: 0.05,
  },
};

// Portal placements within Aetheria (chunk coords). Each chunk is 32u.
export const PORTALS: { dimension: DimensionId; chunkX: number; chunkY: number; color: string; name: string }[] = [
  { dimension: 'emberreach', chunkX: 4, chunkY: 0, color: '#ff5a3a', name: 'Crimson Portal' },
  { dimension: 'tidewell', chunkX: -4, chunkY: 0, color: '#3aa6ff', name: 'Azure Portal' },
  { dimension: 'voidspire', chunkX: 0, chunkY: 5, color: '#6b3dff', name: 'Obsidian Portal' },
  { dimension: 'skyloft', chunkX: 0, chunkY: -5, color: '#fff3a3', name: 'Skyborne Portal' },
];

export const RETURN_PORTAL = { color: '#fff3a3', name: 'Return Portal to Aetheria' };

// Pick a biome for given world coords + dimension
export function biomeAt(worldX: number, worldY: number, dim: DimensionConfig, seed: number): BiomeId {
  // Combine two noise samples
  const sx = worldX * dim.scale;
  const sy = worldY * dim.scale;
  const a = valueNoiseLite(sx, sy, seed + 1);
  const b = valueNoiseLite(sx * 2.3, sy * 2.3, seed + 7);
  const list = dim.biomes;
  // Map (a,b) into bucket
  const idx = Math.floor(a * list.length * 0.999);
  // Special-case high "wetness" → wetland-equivalent
  if (dim.id === 'aetheria') {
    if (b > 0.78) return 'wetland';
    if (a > 0.7) return 'forest';
    if (a > 0.55) return 'tallgrass';
    if (a < 0.25) return 'rocky';
    return 'meadow';
  }
  if (dim.id === 'emberreach') {
    if (b > 0.78) return 'lava';
    if (a > 0.65) return 'ember';
    if (a < 0.3) return 'obsidian';
    return 'ash';
  }
  if (dim.id === 'tidewell') {
    if (b > 0.7) return 'isle';
    if (a > 0.7) return 'shore';
    if (a < 0.3) return 'deep';
    return 'reef';
  }
  if (dim.id === 'voidspire') {
    if (b > 0.78) return 'glow';
    if (a > 0.65) return 'shade';
    if (a < 0.3) return 'ruin';
    return 'void';
  }
  if (dim.id === 'skyloft') {
    if (b > 0.78) return 'storm';
    if (a > 0.65) return 'peak';
    return 'cloud';
  }
  return list[idx];
}

import { valueNoise as valueNoiseLite } from '@/systems/noise';

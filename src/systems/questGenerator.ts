import { DIMENSIONS, type DimensionId } from '@/data/dimensions';
import { SPECIES } from '@/data/creatures';
import type { Quest } from '@/types';

export type DynamicQuestType = 'collect' | 'defeat-boss' | 'explore' | 'level-up';

export interface DynamicQuest extends Quest {
  type: DynamicQuestType;
  target: { speciesId?: string; count?: number; bossId?: string; level?: number; dimension?: DimensionId };
  progress: number;
}

const QUEST_NAMES_COLLECT = ['A Companion of Curiosity', 'For the Census', 'Wild Roster', 'A Field Study'];
const QUEST_NAMES_BOSS = ['The Looming Threat', 'Quiet the Monolith', 'Tame the Tempest', 'The Watcher Stirs'];
const QUEST_NAMES_EXPLORE = ['A New Horizon', 'Into the Unknown', 'Beyond the Veil', 'Worlds Apart'];

let questCounter = 1;

function genId(): string {
  questCounter += 1;
  return `dq_${Date.now().toString(36)}_${questCounter}`;
}

export function generateCollectQuest(): DynamicQuest {
  const candidates = Object.values(SPECIES).filter((s) => s.rarity !== 'legendary');
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const count = 1 + Math.floor(Math.random() * 3);
  const id = genId();
  return {
    id,
    title: QUEST_NAMES_COLLECT[Math.floor(Math.random() * QUEST_NAMES_COLLECT.length)],
    description: `Catch ${count} wild ${target.name}${count > 1 ? 's' : ''} for the field study.`,
    steps: Array.from({ length: count }, (_, i) => ({ id: `s${i}`, text: `Capture ${target.name} (${i + 1}/${count})`, done: false })),
    completed: false,
    reward: '3x Healing Berry',
    type: 'collect',
    target: { speciesId: target.id, count },
    progress: 0,
  };
}

export function generateExploreQuest(): DynamicQuest {
  const dims = (Object.keys(DIMENSIONS) as DimensionId[]).filter((d) => d !== 'aetheria');
  const target = dims[Math.floor(Math.random() * dims.length)];
  const dim = DIMENSIONS[target];
  const id = genId();
  return {
    id,
    title: QUEST_NAMES_EXPLORE[Math.floor(Math.random() * QUEST_NAMES_EXPLORE.length)],
    description: `Travel to ${dim.name} via its portal in Aetheria. ${dim.description}`,
    steps: [{ id: 's1', text: `Enter ${dim.name}`, done: false }],
    completed: false,
    reward: '2x Super Capsule',
    type: 'explore',
    target: { dimension: target },
    progress: 0,
  };
}

export function generateBossQuest(): DynamicQuest {
  const id = genId();
  return {
    id,
    title: QUEST_NAMES_BOSS[Math.floor(Math.random() * QUEST_NAMES_BOSS.length)],
    description: 'A great power has stirred in the wilds. Find a marked boss spawn and defeat or befriend it.',
    steps: [{ id: 's1', text: 'Defeat or capture any wild boss', done: false }],
    completed: false,
    reward: '1x Energy Potion',
    type: 'defeat-boss',
    target: {},
    progress: 0,
  };
}

export function generateLevelQuest(currentMaxLevel: number): DynamicQuest {
  const target = Math.min(60, currentMaxLevel + 5);
  const id = genId();
  return {
    id,
    title: 'Train Hard',
    description: `Bring any Companion to level ${target}.`,
    steps: [{ id: 's1', text: `Reach Lv ${target}`, done: false }],
    completed: false,
    reward: '5x Healing Berry',
    type: 'level-up',
    target: { level: target },
    progress: 0,
  };
}

export function rollNewBoardQuest(currentMaxLevel: number): DynamicQuest {
  const r = Math.random();
  if (r < 0.45) return generateCollectQuest();
  if (r < 0.7) return generateBossQuest();
  if (r < 0.9) return generateExploreQuest();
  return generateLevelQuest(currentMaxLevel);
}

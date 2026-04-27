import type { TrainerData } from '@/types';

export const TRAINERS: Record<string, TrainerData> = {
  bram: {
    id: 'bram',
    name: 'Scout Bram',
    team: [
      { speciesId: 'pebblor', level: 5 },
      { speciesId: 'mudmole', level: 6 },
    ],
    rewardXp: 80,
    victoryText: 'Whew! That was a close one. You\'ve earned this!',
    defeatText: 'Hah! Your Companions need more training, friend.',
  },
};

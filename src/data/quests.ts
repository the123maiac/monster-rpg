import type { Quest } from '@/types';

export const QUEST_TEMPLATES: Record<string, Omit<Quest, 'completed'>> = {
  q_starter: {
    id: 'q_starter',
    title: 'A First Companion',
    description: 'Visit Professor Cedrin\'s lab and choose your starter Companion.',
    steps: [
      { id: 's1', text: 'Speak with Prof. Cedrin', done: false },
      { id: 's2', text: 'Choose your starter Companion', done: false },
    ],
    reward: '5x Capture Capsule',
  },
  q_capture: {
    id: 'q_capture',
    title: 'Wilds Surveyed',
    description: 'Help Ranger Toma by capturing a wild Companion on Route One.',
    steps: [
      { id: 's1', text: 'Capture a wild Companion', done: false },
      { id: 's2', text: 'Return to Ranger Toma', done: false },
    ],
    reward: '2x Super Capsule',
  },
  q_trainer: {
    id: 'q_trainer',
    title: 'Trial by Trainer',
    description: 'Defeat Scout Bram on the route to prove your training.',
    steps: [{ id: 's1', text: 'Defeat Scout Bram', done: false }],
    reward: 'Energy Potion',
  },
};

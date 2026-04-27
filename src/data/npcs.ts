import type { NPCData } from '@/types';

export const NPCS: NPCData[] = [
  {
    id: 'professor',
    name: 'Prof. Cedrin',
    position: [-6, 0, -4],
    rotation: 0.5,
    color: '#e9d4a3',
    hat: 'lab',
    dialogue: [
      'Welcome to Verdant Hollow, traveler!',
      'I\'m Professor Cedrin. I study the bond between humans and Companions.',
      'Today is the day you choose your very first Companion.',
      'Step into the lab when you\'re ready — I\'ve prepared three for you.',
    ],
    quest: { triggers: 'q_starter', givesQuest: 'q_starter' },
    oneTime: true,
  },
  {
    id: 'mom',
    name: 'Mom',
    position: [4, 0, 6],
    rotation: -1.2,
    color: '#f5b1c3',
    dialogue: [
      'Off on your big adventure?',
      'Don\'t forget to rest your Companions when they\'re tired!',
      'I\'ve packed you some Healing Berries. Stay safe out there.',
    ],
  },
  {
    id: 'townie1',
    name: 'Old Hap',
    position: [12, 0, 2],
    rotation: -1.8,
    color: '#bda37a',
    dialogue: [
      'Mighty fine day, ain\'t it?',
      'Watch out for the tall grass on the route — wild ones leap out!',
    ],
  },
  {
    id: 'townie2',
    name: 'Lila',
    position: [-2, 0, 10],
    rotation: 2.4,
    color: '#9bc7ff',
    dialogue: [
      'I heard a Glimray was spotted near the old pond. So rare!',
      'Maybe you\'ll be the one to befriend it someday.',
    ],
  },
  {
    id: 'questGiver',
    name: 'Ranger Toma',
    position: [0, 0, 14],
    rotation: 3.14,
    color: '#9bd9a3',
    hat: 'ranger',
    dialogue: [
      'Hold up, traveler! I\'m monitoring wild populations on Route One.',
      'Could you do me a favor? Capture one wild Companion out there.',
      'Bring it back and I\'ll share what I\'ve learned. Deal?',
    ],
    quest: { triggers: 'q_capture', givesQuest: 'q_capture' },
  },
  {
    id: 'trainer1',
    name: 'Scout Bram',
    position: [4, 0, 24],
    rotation: 3.14,
    color: '#d6a06e',
    hat: 'cap',
    dialogue: [
      'Hey! Trainer spotted!',
      'You can\'t just stroll past me — let\'s battle!',
    ],
    postBattleDialogue: [
      'Ngh… your Companion fought with real heart.',
      'Take this path north for the deep forest.',
    ],
    isTrainer: true,
    trainerId: 'bram',
  },
];

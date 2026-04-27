import { create } from 'zustand';

export type TutorialStepId =
  | 'welcome'
  | 'move'
  | 'find-prof'
  | 'pick-starter'
  | 'leave-lab'
  | 'enter-grass'
  | 'first-battle'
  | 'capture-tip'
  | 'party-menu'
  | 'save-tip'
  | 'done';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  body: string;
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showOn?: 'main-menu' | 'overworld' | 'starter-selection' | 'battle' | 'party' | 'any';
  autoAdvance?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Aetheria',
    body: 'You\'re about to set out on a Companion-collecting journey. I\'ll guide you for the first few steps.',
    anchor: 'center',
    showOn: 'any',
  },
  {
    id: 'move',
    title: 'Moving Around',
    body: 'Use WASD or arrow keys to walk. On a controller, the left stick or D-pad. On mobile, the on-screen joystick.',
    anchor: 'bottom-left',
    showOn: 'overworld',
  },
  {
    id: 'find-prof',
    title: 'Find the Professor',
    body: 'Walk to Professor Cedrin near the research lab — the building with the antenna and lit-up beacon. Press E or Space to talk.',
    anchor: 'top-left',
    showOn: 'overworld',
    autoAdvance: true,
  },
  {
    id: 'pick-starter',
    title: 'Choose Your Companion',
    body: 'Pick the Companion whose element appeals most. Each has different strengths — but truly, they\'re all good choices.',
    anchor: 'center',
    showOn: 'starter-selection',
    autoAdvance: true,
  },
  {
    id: 'leave-lab',
    title: 'Step Onto the Path',
    body: 'Head north along the path. The grass area beyond the village hides wild Companions you can battle and capture.',
    anchor: 'top-right',
    showOn: 'overworld',
    autoAdvance: true,
  },
  {
    id: 'enter-grass',
    title: 'Tall Grass',
    body: 'Wild Companions hide in tall grass. Walk through the patch of bright green to trigger an encounter.',
    anchor: 'bottom-right',
    showOn: 'overworld',
    autoAdvance: true,
  },
  {
    id: 'first-battle',
    title: 'Your First Battle',
    body: 'Pick "Fight" to attack. Different elements have advantages — Aqua beats Flame, Flame beats Leaf, Leaf beats Aqua, and so on. Type advantage doubles your damage!',
    anchor: 'center',
    showOn: 'battle',
    autoAdvance: true,
  },
  {
    id: 'capture-tip',
    title: 'Capturing',
    body: 'Weaken a wild Companion first, then pick "Capsule" and throw a Capture Capsule. Lower HP = higher catch chance!',
    anchor: 'center',
    showOn: 'battle',
  },
  {
    id: 'party-menu',
    title: 'Your Party',
    body: 'Press C anytime to view your team. You can switch active Companion, use healing items, and check stats.',
    anchor: 'bottom-right',
    showOn: 'overworld',
  },
  {
    id: 'save-tip',
    title: 'Save Often',
    body: 'Your progress saves automatically after battles, but you can also press the Save button anytime. Now go forth — adventure awaits!',
    anchor: 'bottom-right',
    showOn: 'overworld',
  },
];

interface TutorialStore {
  active: boolean;
  stepIdx: number;
  completed: boolean;
  start: () => void;
  next: () => void;
  skip: () => void;
  finish: () => void;
  goTo: (id: TutorialStepId) => void;
  load: () => void;
}

const KEY = 'aetheria-tutorial-v1';

export const useTutorial = create<TutorialStore>((set, get) => ({
  active: false,
  stepIdx: 0,
  completed: false,

  start: () => {
    set({ active: true, stepIdx: 0, completed: false });
    persist(get());
  },

  next: () => {
    const { stepIdx } = get();
    const nextIdx = stepIdx + 1;
    if (nextIdx >= TUTORIAL_STEPS.length) {
      set({ active: false, completed: true });
    } else {
      set({ stepIdx: nextIdx });
    }
    persist(get());
  },

  skip: () => {
    set({ active: false, completed: true });
    persist(get());
  },

  finish: () => {
    set({ active: false, completed: true });
    persist(get());
  },

  goTo: (id) => {
    const idx = TUTORIAL_STEPS.findIndex((s) => s.id === id);
    if (idx >= 0) {
      const cur = get();
      if (cur.stepIdx < idx && cur.active) {
        set({ stepIdx: idx });
        persist(get());
      }
    }
  },

  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({ completed: !!data.completed });
      }
    } catch {
      /* ignore */
    }
  },
}));

function persist(s: TutorialStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ completed: s.completed }));
  } catch {
    /* ignore */
  }
}

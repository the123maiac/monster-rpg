import { create } from 'zustand';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  hidden?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_companion', name: 'A Bond Begins', description: 'Choose your first Companion.', icon: '🌟' },
  { id: 'first_capture', name: 'Gotcha!', description: 'Capture your first wild Companion.', icon: '✨' },
  { id: 'first_battle_win', name: 'First Victory', description: 'Win your first wild battle.', icon: '⚔️' },
  { id: 'first_trainer_win', name: 'Rising Trainer', description: 'Defeat your first trainer.', icon: '🏆' },
  { id: 'level_10', name: 'Growing Strong', description: 'Bring a Companion to Lv 10.', icon: '📈' },
  { id: 'level_20', name: 'Veteran Bond', description: 'Bring a Companion to Lv 20.', icon: '💪' },
  { id: 'evolved', name: 'Transcendence', description: 'Evolve a Companion.', icon: '🔮' },
  { id: 'shiny_found', name: 'Lucky Star', description: 'Encounter a shiny Companion.', icon: '✦', hidden: true },
  { id: 'shiny_caught', name: 'Treasured', description: 'Capture a shiny Companion.', icon: '💎', hidden: true },
  { id: 'collected_5', name: 'Collector I', description: 'Catch 5 different species.', icon: '📚' },
  { id: 'collected_all', name: 'Master Cataloguer', description: 'Catch every species in Aetheria.', icon: '👑' },
  { id: 'legendary', name: 'Mythic Encounter', description: 'Befriend a legendary Companion.', icon: '🌠' },
  { id: 'daily_winner', name: 'Champion of the Day', description: 'Win the Daily Challenge.', icon: '☀' },
  { id: 'pvp_winner', name: 'Friendly Rivalry', description: 'Win a battle vs a friend\'s code.', icon: '🤝' },
  { id: 'capsule_lord', name: 'Capsule Tactician', description: 'Capture 10 wild Companions.', icon: '🎯' },
];

interface AchievementsStore {
  unlocked: string[];
  pending: { ach: Achievement; key: number } | null;
  unlock: (id: string) => void;
  load: () => void;
  reset: () => void;
}

const KEY = 'aetheria-achievements-v1';

export const useAchievements = create<AchievementsStore>((set, get) => ({
  unlocked: [],
  pending: null,

  unlock: (id) => {
    const cur = get();
    if (cur.unlocked.includes(id)) return;
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;
    const next = [...cur.unlocked, id];
    set({ unlocked: next, pending: { ach, key: Date.now() } });
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    // Auto-clear pending toast after delay
    setTimeout(() => {
      const after = get();
      if (after.pending && after.pending.key === Date.now()) {
        // unlikely match; clear by other timer
      }
    }, 0);
    setTimeout(() => {
      set((s) => (s.pending && s.pending.ach.id === id ? { pending: null } : {}));
    }, 4500);
  },

  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) set({ unlocked: arr });
      }
    } catch {
      /* ignore */
    }
  },

  reset: () => {
    set({ unlocked: [] });
    localStorage.removeItem(KEY);
  },
}));

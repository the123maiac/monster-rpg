import { SPECIES, listSpecies } from '@/data/creatures';
import { buildInstance } from './stats';
import type { CreatureInstance } from '@/types';

const MAGIC = 'AETv1';

export interface SharedTeam {
  trainerName: string;
  party: { speciesId: string; level: number; iv: { hp: number; attack: number; defense: number; speed: number }; shiny: boolean; nickname?: string }[];
  signedAt: number;
}

export function packTeam(trainerName: string, party: CreatureInstance[]): string {
  const data: SharedTeam = {
    trainerName,
    party: party.slice(0, 6).map((p) => ({
      speciesId: p.speciesId,
      level: p.level,
      iv: p.iv,
      shiny: p.shiny,
      nickname: p.nickname,
    })),
    signedAt: Date.now(),
  };
  const json = JSON.stringify(data);
  return MAGIC + '.' + btoa(unescape(encodeURIComponent(json)));
}

export function unpackTeam(code: string): SharedTeam | null {
  try {
    if (!code.startsWith(MAGIC + '.')) return null;
    const b64 = code.slice(MAGIC.length + 1);
    const json = decodeURIComponent(escape(atob(b64)));
    const data = JSON.parse(json) as SharedTeam;
    if (!data.party || data.party.length === 0) return null;
    for (const p of data.party) {
      if (!SPECIES[p.speciesId]) return null;
      if (typeof p.level !== 'number' || p.level < 1 || p.level > 100) return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function instantiateSharedParty(team: SharedTeam): CreatureInstance[] {
  return team.party.map((p) => {
    const inst = buildInstance(p.speciesId, p.level, { shiny: p.shiny, nickname: p.nickname });
    inst.iv = p.iv;
    return inst;
  });
}

// === Daily Challenge ===

function dateSeed(d = new Date()): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seedRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = Math.imul(48271, h) | 0;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

const DAILY_NAMES = ['Champion Vesper', 'Champion Soren', 'Champion Iris', 'Champion Caelum', 'Champion Marin', 'Champion Aurea'];

export function getDailyChallenge(): { team: SharedTeam; seed: string } {
  const seed = dateSeed();
  const rng = seedRng(seed);
  const allSpecies = listSpecies().filter((s) => s.rarity !== 'legendary');
  const pickSpecies = () => allSpecies[Math.floor(rng() * allSpecies.length)];
  const baseLevel = 8 + Math.floor(rng() * 6);
  const party = Array.from({ length: 3 }, () => {
    const sp = pickSpecies();
    return {
      speciesId: sp.id,
      level: baseLevel + Math.floor(rng() * 4),
      iv: { hp: Math.floor(rng() * 16), attack: Math.floor(rng() * 16), defense: Math.floor(rng() * 16), speed: Math.floor(rng() * 16) },
      shiny: rng() < 0.05,
    };
  });
  const team: SharedTeam = {
    trainerName: DAILY_NAMES[Math.floor(rng() * DAILY_NAMES.length)],
    party,
    signedAt: Date.now(),
  };
  return { team, seed };
}

// === Daily best score (turns) ===
const DAILY_KEY = 'aetheria-daily-v1';
export interface DailyRecord {
  seed: string;
  attempts: number;
  bestTurns: number | null;
  bestWonAt: number | null;
}
export function loadDailyRecord(): DailyRecord {
  const seed = dateSeed();
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const r = JSON.parse(raw) as DailyRecord;
      if (r.seed === seed) return r;
    }
  } catch {
    /* ignore */
  }
  return { seed, attempts: 0, bestTurns: null, bestWonAt: null };
}

export function saveDailyResult(result: { won: boolean; turns: number }) {
  const cur = loadDailyRecord();
  cur.attempts += 1;
  if (result.won && (cur.bestTurns === null || result.turns < cur.bestTurns)) {
    cur.bestTurns = result.turns;
    cur.bestWonAt = Date.now();
  }
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(cur));
  } catch {
    /* ignore */
  }
  return cur;
}

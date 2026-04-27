import { SPECIES } from '@/data/creatures';
import type { CreatureInstance, CreatureSpecies } from '@/types';

export function rollIVs() {
  const r = () => Math.floor(Math.random() * 16);
  return { hp: r(), attack: r(), defense: r(), speed: r() };
}

export function maxHpFor(species: CreatureSpecies, level: number, ivHp: number): number {
  return Math.floor(((2 * species.baseStats.hp + ivHp) * level) / 100) + level + 10;
}

export function statFor(base: number, iv: number, level: number): number {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

export function fullStats(instance: CreatureInstance) {
  const sp = SPECIES[instance.speciesId];
  const lvl = instance.level;
  return {
    species: sp,
    maxHp: maxHpFor(sp, lvl, instance.iv.hp),
    attack: statFor(sp.baseStats.attack, instance.iv.attack, lvl),
    defense: statFor(sp.baseStats.defense, instance.iv.defense, lvl),
    speed: statFor(sp.baseStats.speed, instance.iv.speed, lvl),
  };
}

export function xpForNextLevel(level: number): number {
  return Math.floor(level ** 3 * 0.8);
}

let uidCounter = 1;
export function newUid(): string {
  uidCounter += 1;
  return `c_${Date.now().toString(36)}_${uidCounter}`;
}

export function buildInstance(
  speciesId: string,
  level: number,
  options?: { shiny?: boolean; nickname?: string }
): CreatureInstance {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error(`Unknown species ${speciesId}`);
  const iv = rollIVs();
  const moves = sp.moves.slice(0, 4);
  const inst: CreatureInstance = {
    uid: newUid(),
    speciesId,
    level,
    xp: 0,
    currentHp: 0,
    moves,
    shiny: options?.shiny ?? Math.random() < 1 / 256,
    iv,
    nickname: options?.nickname,
  };
  inst.currentHp = maxHpFor(sp, level, iv.hp);
  return inst;
}

export function healInstance(inst: CreatureInstance, amount: number): number {
  const max = maxHpFor(SPECIES[inst.speciesId], inst.level, inst.iv.hp);
  const before = inst.currentHp;
  inst.currentHp = Math.min(max, inst.currentHp + amount);
  return inst.currentHp - before;
}

export function fullHeal(inst: CreatureInstance) {
  const max = maxHpFor(SPECIES[inst.speciesId], inst.level, inst.iv.hp);
  inst.currentHp = max;
}

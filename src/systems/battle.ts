import { SPECIES } from '@/data/creatures';
import { MOVES, elementMultiplier } from '@/data/moves';
import type { BattleParticipant, CreatureInstance } from '@/types';
import { fullStats, maxHpFor } from './stats';

export function toBattleParticipant(inst: CreatureInstance): BattleParticipant {
  const stats = fullStats(inst);
  return {
    uid: inst.uid,
    speciesId: inst.speciesId,
    level: inst.level,
    currentHp: inst.currentHp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    moves: inst.moves,
    shiny: inst.shiny,
  };
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
  missed: boolean;
}

export function computeDamage(
  attacker: BattleParticipant,
  defender: BattleParticipant,
  moveId: string
): DamageResult {
  const move = MOVES[moveId];
  if (!move) return { damage: 0, effectiveness: 1, critical: false, missed: true };
  if (move.power === 0) return { damage: 0, effectiveness: 1, critical: false, missed: false };

  if (Math.random() * 100 > move.accuracy) {
    return { damage: 0, effectiveness: 1, critical: false, missed: true };
  }

  const attackerSp = SPECIES[attacker.speciesId];
  const defenderSp = SPECIES[defender.speciesId];
  const stab = attackerSp.element === move.element || attackerSp.secondaryElement === move.element ? 1.5 : 1;
  let eff = elementMultiplier(move.element, defenderSp.element);
  if (defenderSp.secondaryElement) {
    eff *= elementMultiplier(move.element, defenderSp.secondaryElement);
  }
  const critical = Math.random() < 1 / 16;
  const critMul = critical ? 1.5 : 1;
  const rand = 0.85 + Math.random() * 0.15;
  const base =
    ((((2 * attacker.level) / 5 + 2) * move.power * (attacker.attack / Math.max(1, defender.defense))) / 50 + 2) *
    stab *
    eff *
    critMul *
    rand;
  return { damage: Math.max(1, Math.floor(base)), effectiveness: eff, critical, missed: false };
}

export function effectivenessText(eff: number): string | null {
  if (eff === 0) return ' It had no effect…';
  if (eff >= 1.5) return ' It\'s super effective!';
  if (eff < 1 && eff > 0) return ' It\'s not very effective…';
  return null;
}

export function pickEnemyMove(enemy: BattleParticipant): string {
  return enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
}

export function calcXpGain(defenderLevel: number, isWild: boolean): number {
  return Math.floor((isWild ? 1 : 1.5) * defenderLevel * 8);
}

export function applyXp(inst: CreatureInstance, xp: number): { leveled: boolean; newLevel: number } {
  let leveled = false;
  inst.xp += xp;
  let nextNeeded = (lvl: number) => Math.floor(lvl ** 3 * 0.8);
  while (inst.xp >= nextNeeded(inst.level + 1) && inst.level < 100) {
    const prevMax = maxHpFor(SPECIES[inst.speciesId], inst.level, inst.iv.hp);
    inst.level += 1;
    leveled = true;
    const newMax = maxHpFor(SPECIES[inst.speciesId], inst.level, inst.iv.hp);
    inst.currentHp = Math.min(newMax, inst.currentHp + (newMax - prevMax));
  }
  return { leveled, newLevel: inst.level };
}

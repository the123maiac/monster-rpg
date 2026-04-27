import { SPECIES } from '@/data/creatures';
import type { BattleParticipant } from '@/types';

export function attemptCapture(
  enemy: BattleParticipant,
  capsuleStrength: number
): { success: boolean; shakes: number } {
  const sp = SPECIES[enemy.speciesId];
  const hpRatio = enemy.currentHp / enemy.maxHp;
  const baseRate = sp.captureDifficulty;
  const a = ((3 * enemy.maxHp - 2 * enemy.currentHp) * baseRate * capsuleStrength) / (3 * enemy.maxHp);
  const b = Math.floor(65536 / Math.pow(255 / Math.max(1, a), 0.1875));
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() * 65536 < b) shakes += 1;
    else break;
  }
  return { success: shakes >= 4, shakes };
}

import { create } from 'zustand';
import { ITEMS, STARTER_INVENTORY } from '@/data/items';
import { NPCS } from '@/data/npcs';
import { QUEST_TEMPLATES } from '@/data/quests';
import { TRAINERS } from '@/data/trainers';
import { MOVES } from '@/data/moves';
import { PARTY_MAX, STARTER_LEVEL } from '@/game/constants';
import {
  applyXp,
  computeDamage,
  effectivenessText,
  pickEnemyMove,
  toBattleParticipant,
  calcXpGain,
} from '@/systems/battle';
import { attemptCapture } from '@/systems/capture';
import { rollWild, rollWildAt } from '@/systems/encounter';
import { rollNewBoardQuest, type DynamicQuest } from '@/systems/questGenerator';
import { loadGame, loadSettings, saveGame, saveSettings } from '@/systems/save';
import { buildInstance, fullStats, healInstance, fullHeal, maxHpFor } from '@/systems/stats';
import { SPECIES } from '@/data/creatures';
import { sfx } from '@/systems/sound';
import { useAchievements } from '@/systems/achievements';
import { saveDailyResult } from '@/systems/multiplayer';
import type {
  BattleState,
  CreatureInstance,
  DialogueState,
  GameScreen,
  PlayerData,
  Quest,
  Settings,
} from '@/types';

interface GameStore {
  screen: GameScreen;
  prevScreen: GameScreen;
  fading: boolean;

  player: PlayerData;
  settings: Settings;

  battle: BattleState | null;
  dialogue: DialogueState;
  toast: { text: string; key: number } | null;

  setScreen: (s: GameScreen) => void;
  fadeTo: (s: GameScreen) => void;
  showToast: (text: string) => void;

  newGame: () => void;
  pickStarter: (speciesId: string) => void;
  loadFromStorage: () => boolean;
  save: () => void;

  setPlayerPosition: (x: number, y: number, z: number, facing: number) => void;
  startDialogue: (npcId: string, lines: string[], speakerName: string, onComplete?: () => void) => void;
  advanceDialogue: () => void;

  startWildEncounter: () => void;
  startWildEncounterAt: (x: number, z: number) => void;
  startBossBattle: (speciesId: string, level: number, bossId: string) => void;
  startTrainerBattle: (trainerId: string) => void;
  startPvpBattle: (kind: 'daily' | 'friend', name: string, team: CreatureInstance[]) => void;
  travelToDimension: (dim: PlayerData['dimension']) => void;
  generateNewQuest: () => void;
  refreshQuestBoard: () => void;
  battlePickMove: (moveId: string) => void;
  battleUseItem: (itemId: string) => void;
  battleSwitch: (uid: string) => void;
  battleRun: () => void;
  battleAdvance: () => void;
  endBattle: (outcome: 'win' | 'flee' | 'caught' | 'lose') => void;

  swapPartyOrder: (uidA: string, uidB: string) => void;
  selectActive: (uid: string) => void;

  giveItem: (itemId: string, n: number) => void;
  consumeItem: (itemId: string, n?: number) => boolean;
  useItemOn: (itemId: string, uid: string) => boolean;

  startQuest: (id: string) => void;
  advanceQuest: (id: string, stepIdx: number) => void;
  completeQuest: (id: string) => void;

  markNpcTriggered: (id: string) => void;
  recordDefeatedTrainer: (id: string) => void;

  resetSettings: (s: Partial<Settings>) => void;
}

function defaultPlayer(): PlayerData {
  return {
    name: 'Hero',
    position: [0, 0, 6],
    facing: 0,
    party: [],
    storage: [],
    inventory: STARTER_INVENTORY.map((s) => ({ ...s })),
    defeatedTrainers: [],
    triggeredNpcs: [],
    quests: [],
    capturedSpecies: [],
    dimension: 'aetheria',
    dimensionPositions: { aetheria: [0, 0, 6] },
    defeatedBosses: [],
    capturedBosses: [],
    visitedDimensions: ['aetheria'],
    speciesCaptureCount: {},
  };
}

function defaultSettings(): Settings {
  return { musicVolume: 0.5, sfxVolume: 0.6, textSpeed: 'normal' };
}

function freshBattle(player: CreatureInstance, enemy: CreatureInstance, isWild: boolean, trainerId?: string, teamIdx = 0): BattleState {
  const p = toBattleParticipant(player);
  const e = toBattleParticipant(enemy);
  return {
    active: true,
    isWild,
    isTrainer: !isWild,
    trainerId,
    trainerTeamIndex: teamIdx,
    player: p,
    enemy: e,
    log: [
      isWild
        ? `A wild ${SPECIES[enemy.speciesId].name} appeared!`
        : `${TRAINERS[trainerId!].name} sent out ${SPECIES[enemy.speciesId].name}!`,
      `Go, ${SPECIES[player.speciesId].name}!`,
    ],
    phase: 'intro',
    awaitingContinue: true,
    attackerFlash: null,
    shake: false,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'main-menu',
  prevScreen: 'main-menu',
  fading: false,

  player: defaultPlayer(),
  settings: loadSettings() ?? defaultSettings(),

  battle: null,
  dialogue: { active: false, speakerName: '', lines: [], index: 0 },
  toast: null,

  setScreen: (s) => set((st) => ({ prevScreen: st.screen, screen: s })),

  fadeTo: (s) => {
    set({ fading: true });
    setTimeout(() => {
      set((st) => ({ prevScreen: st.screen, screen: s }));
      setTimeout(() => set({ fading: false }), 50);
    }, 350);
  },

  showToast: (text) => {
    set({ toast: { text, key: Date.now() } });
    setTimeout(() => {
      const t = get().toast;
      if (t && Date.now() - t.key > 2400) set({ toast: null });
    }, 2600);
  },

  newGame: () => {
    set({
      player: defaultPlayer(),
      battle: null,
      dialogue: { active: false, speakerName: '', lines: [], index: 0 },
    });
    get().fadeTo('starter-selection');
  },

  pickStarter: (speciesId) => {
    const inst = buildInstance(speciesId, STARTER_LEVEL);
    set((st) => ({
      player: {
        ...st.player,
        party: [inst],
        capturedSpecies: [speciesId],
      },
    }));
    get().startQuest('q_starter');
    get().advanceQuest('q_starter', 0);
    get().advanceQuest('q_starter', 1);
    get().completeQuest('q_starter');
    get().startQuest('q_capture');
    sfx.confirm();
    useAchievements.getState().unlock('first_companion');
    get().fadeTo('overworld');
    setTimeout(() => {
      get().showToast(`You received ${SPECIES[speciesId].name}!`);
    }, 800);
  },

  loadFromStorage: () => {
    const blob = loadGame();
    if (!blob) return false;
    // Migrate older saves missing newer fields
    const migrated: PlayerData = {
      ...blob.player,
      dimension: blob.player.dimension ?? 'aetheria',
      dimensionPositions: blob.player.dimensionPositions ?? { aetheria: blob.player.position },
      defeatedBosses: blob.player.defeatedBosses ?? [],
      capturedBosses: blob.player.capturedBosses ?? [],
      visitedDimensions: blob.player.visitedDimensions ?? ['aetheria'],
      speciesCaptureCount: blob.player.speciesCaptureCount ?? {},
    };
    set({ player: migrated, settings: blob.settings });
    get().fadeTo('overworld');
    return true;
  },

  save: () => {
    const ok = saveGame(get().player, get().settings);
    if (ok) get().showToast('Game saved.');
  },

  setPlayerPosition: (x, y, z, facing) =>
    set((st) => ({ player: { ...st.player, position: [x, y, z], facing } })),

  startDialogue: (npcId, lines, speakerName, onComplete) => {
    set({ dialogue: { active: true, npcId, lines, index: 0, speakerName, onComplete } });
  },

  advanceDialogue: () => {
    const d = get().dialogue;
    if (!d.active) return;
    if (d.index < d.lines.length - 1) {
      set({ dialogue: { ...d, index: d.index + 1 } });
    } else {
      const cb = d.onComplete;
      set({ dialogue: { active: false, speakerName: '', lines: [], index: 0 } });
      cb?.();
    }
  },

  startWildEncounter: () => {
    const party = get().player.party;
    const active = party.find((c) => c.currentHp > 0);
    if (!active) return;
    const enemy = rollWild();
    if (enemy.shiny) useAchievements.getState().unlock('shiny_found');
    if (SPECIES[enemy.speciesId].rarity === 'legendary') useAchievements.getState().unlock('legendary');
    sfx.encounter();
    set({ battle: freshBattle(active, enemy, true) });
    get().fadeTo('battle');
  },

  startWildEncounterAt: (x, z) => {
    const stx = get();
    const party = stx.player.party;
    const active = party.find((c) => c.currentHp > 0);
    if (!active) return;
    const playerMaxLevel = party.reduce((mx, p) => Math.max(mx, p.level), 1);
    const enemy = rollWildAt(stx.player.dimension, x, z, playerMaxLevel);
    if (enemy.shiny) useAchievements.getState().unlock('shiny_found');
    if (SPECIES[enemy.speciesId].rarity === 'legendary') useAchievements.getState().unlock('legendary');
    sfx.encounter();
    set({ battle: freshBattle(active, enemy, true) });
    get().fadeTo('battle');
  },

  startBossBattle: (speciesId, level, bossId) => {
    const stx = get();
    const party = stx.player.party;
    const active = party.find((c) => c.currentHp > 0);
    if (!active) return;
    const enemy = buildInstance(speciesId, level);
    sfx.encounter();
    const b = freshBattle(active, enemy, true);
    set({
      battle: {
        ...b,
        isBoss: true,
        bossId,
        log: [`A wild Boss ${SPECIES[speciesId].name} emerges!`, `Go, ${SPECIES[active.speciesId].name}!`],
      },
    });
    get().fadeTo('battle');
  },

  startTrainerBattle: (trainerId) => {
    const trainer = TRAINERS[trainerId];
    if (!trainer) return;
    const party = get().player.party;
    const active = party.find((c) => c.currentHp > 0);
    if (!active) return;
    const enemyData = trainer.team[0];
    const enemy = buildInstance(enemyData.speciesId, enemyData.level);
    set({ battle: freshBattle(active, enemy, false, trainerId, 0) });
    get().fadeTo('battle');
  },

  startPvpBattle: (kind, name, team) => {
    const stx = get();
    const party = stx.player.party;
    const active = party.find((c) => c.currentHp > 0);
    if (!active || team.length === 0) return;
    const enemyTeamParts = team.map(toBattleParticipant);
    const playerPart = toBattleParticipant(active);
    const log = [
      `${name} wants to battle!`,
      `${name} sent out ${SPECIES[team[0].speciesId].name}!`,
      `Go, ${SPECIES[active.speciesId].name}!`,
    ];
    set({
      battle: {
        active: true,
        isWild: false,
        isTrainer: false,
        isPvp: true,
        pvpKind: kind,
        pvpEnemyName: name,
        pvpEnemyTeam: enemyTeamParts,
        pvpEnemyTeamIndex: 0,
        pvpTurnsTaken: 0,
        player: playerPart,
        enemy: enemyTeamParts[0],
        log,
        phase: 'intro',
        awaitingContinue: true,
        attackerFlash: null,
        shake: false,
      },
    });
    get().fadeTo('battle');
  },

  battlePickMove: (moveId) => {
    const st = get();
    const b = st.battle;
    if (!b || b.phase !== 'select-move') return;
    const move = MOVES[moveId];
    const playerSp = SPECIES[b.player.speciesId];
    const enemySp = SPECIES[b.enemy.speciesId];

    const playerFirst = b.player.speed >= b.enemy.speed;
    const log = [...b.log, `${playerSp.name} used ${move.name}!`];
    const newTurns = (b.pvpTurnsTaken ?? 0) + 1;
    set({ battle: { ...b, log, phase: 'animating', attackerFlash: 'player', pvpTurnsTaken: newTurns } });

    const performTurn = () => {
      const cur = get().battle;
      if (!cur) return;
      const result = computeDamage(cur.player, cur.enemy, moveId);
      let newEnemyHp = cur.enemy.currentHp;
      const newLog = [...cur.log];
      if (result.missed) {
        newLog.push('But it missed!');
        sfx.miss();
      } else {
        newEnemyHp = Math.max(0, cur.enemy.currentHp - result.damage);
        if (result.critical) newLog.push('A critical hit!');
        const eff = effectivenessText(result.effectiveness);
        if (eff) newLog.push(eff.trim());
        if (result.effectiveness >= 1.5) sfx.superHit();
        else sfx.hit();
      }
      set({
        battle: {
          ...cur,
          enemy: { ...cur.enemy, currentHp: newEnemyHp },
          log: newLog,
          shake: !result.missed,
          attackerFlash: null,
        },
      });
      setTimeout(() => set((s) => (s.battle ? { battle: { ...s.battle, shake: false } } : {})), 360);

      setTimeout(() => {
        const c = get().battle;
        if (!c) return;
        if (c.enemy.currentHp <= 0) {
          finishVictory();
          return;
        }
        if (playerFirst) {
          enemyTurn();
        } else {
          // shouldn't happen — ordered earlier
        }
      }, 700);
    };

    const enemyTurn = () => {
      const cur = get().battle;
      if (!cur) return;
      const enemyMoveId = pickEnemyMove(cur.enemy);
      const enemyMove = MOVES[enemyMoveId];
      const newLog = [...cur.log, `Foe ${enemySp.name} used ${enemyMove.name}!`];
      set({ battle: { ...cur, log: newLog, attackerFlash: 'enemy' } });
      setTimeout(() => {
        const c2 = get().battle;
        if (!c2) return;
        const result = computeDamage(c2.enemy, c2.player, enemyMoveId);
        let newHp = c2.player.currentHp;
        const log2 = [...c2.log];
        if (result.missed) {
          log2.push('But it missed!');
        } else {
          newHp = Math.max(0, c2.player.currentHp - result.damage);
          if (result.critical) log2.push('A critical hit!');
          const eff = effectivenessText(result.effectiveness);
          if (eff) log2.push(eff.trim());
        }
        set({
          battle: {
            ...c2,
            player: { ...c2.player, currentHp: newHp },
            log: log2,
            shake: !result.missed,
            attackerFlash: null,
          },
        });
        // sync into party
        const stx = get();
        const newParty = stx.player.party.map((p) =>
          p.uid === c2.player.uid ? { ...p, currentHp: newHp } : p
        );
        set({ player: { ...stx.player, party: newParty } });

        setTimeout(() => set((s) => (s.battle ? { battle: { ...s.battle, shake: false } } : {})), 360);

        setTimeout(() => {
          const c3 = get().battle;
          if (!c3) return;
          if (c3.player.currentHp <= 0) {
            finishDefeat();
            return;
          }
          if (!playerFirst) {
            performTurn();
          } else {
            set({ battle: { ...c3, phase: 'select-action', awaitingContinue: false } });
          }
        }, 700);
      }, 500);
    };

    const finishVictory = () => {
      const cur = get().battle;
      if (!cur) return;
      const xp = calcXpGain(cur.enemy.level, cur.isWild);
      const stx = get();
      const partyCopy = stx.player.party.map((p) => ({ ...p }));
      const active = partyCopy.find((p) => p.uid === cur.player.uid)!;
      const lvlBefore = active.level;
      const { leveled, newLevel } = applyXp(active, xp);
      const log2 = [...cur.log, `Foe ${SPECIES[cur.enemy.speciesId].name} fainted!`, `${SPECIES[active.speciesId].name} gained ${xp} XP.`];
      if (leveled) log2.push(`${SPECIES[active.speciesId].name} grew to Lv ${newLevel}!`);

      if (leveled) sfx.levelUp();
      // Evolution check
      const sp = SPECIES[active.speciesId];
      if (sp.evolvesInto && sp.evolveLevel && newLevel >= sp.evolveLevel && lvlBefore < sp.evolveLevel) {
        const newSp = SPECIES[sp.evolvesInto];
        active.speciesId = sp.evolvesInto;
        active.moves = newSp.moves.slice(0, 4);
        log2.push(`What? ${sp.name} is evolving!`);
        log2.push(`${sp.name} evolved into ${newSp.name}!`);
        sfx.evolve();
        useAchievements.getState().unlock('evolved');
      }

      set({
        player: { ...stx.player, party: partyCopy },
        battle: { ...cur, player: { ...cur.player, level: active.level }, log: log2, phase: 'victory', awaitingContinue: true },
      });

      // Trainer chain
      if (!cur.isWild && cur.trainerId) {
        const trainer = TRAINERS[cur.trainerId];
        const next = (cur.trainerTeamIndex ?? 0) + 1;
        if (trainer.team[next]) {
          setTimeout(() => {
            const enemy = buildInstance(trainer.team[next].speciesId, trainer.team[next].level);
            set({
              battle: {
                ...cur,
                enemy: toBattleParticipant(enemy),
                trainerTeamIndex: next,
                log: [...log2, `${trainer.name} sent out ${SPECIES[trainer.team[next].speciesId].name}!`],
                phase: 'intro',
                awaitingContinue: true,
              },
            });
          }, 1400);
        }
      }

      // PvP chain
      if (cur.isPvp && cur.pvpEnemyTeam) {
        const next = (cur.pvpEnemyTeamIndex ?? 0) + 1;
        if (cur.pvpEnemyTeam[next]) {
          setTimeout(() => {
            const nextPart = cur.pvpEnemyTeam![next];
            set({
              battle: {
                ...cur,
                enemy: nextPart,
                pvpEnemyTeamIndex: next,
                log: [...log2, `${cur.pvpEnemyName} sent out ${SPECIES[nextPart.speciesId].name}!`],
                phase: 'intro',
                awaitingContinue: true,
              },
            });
          }, 1400);
        }
      }
    };

    const finishDefeat = () => {
      const cur = get().battle;
      if (!cur) return;
      const stx = get();
      const aliveNext = stx.player.party.find((p) => p.uid !== cur.player.uid && p.currentHp > 0);
      if (aliveNext) {
        set({
          battle: {
            ...cur,
            log: [...cur.log, `${SPECIES[cur.player.speciesId].name} fainted!`, 'Choose a Companion to switch in.'],
            phase: 'select-switch',
            awaitingContinue: false,
          },
        });
      } else {
        set({
          battle: {
            ...cur,
            log: [...cur.log, `${SPECIES[cur.player.speciesId].name} fainted!`, 'You have no Companions left…'],
            phase: 'defeat',
            awaitingContinue: true,
          },
        });
      }
    };

    if (playerFirst) {
      setTimeout(performTurn, 350);
    } else {
      const enemyMoveId = pickEnemyMove(b.enemy);
      const enemyMove = MOVES[enemyMoveId];
      set({ battle: { ...b, log: [...log, `Foe ${enemySp.name} used ${enemyMove.name}!`], attackerFlash: 'enemy' } });
      setTimeout(() => {
        const c = get().battle;
        if (!c) return;
        const result = computeDamage(c.enemy, c.player, enemyMoveId);
        let newHp = c.player.currentHp;
        const lg = [...c.log];
        if (result.missed) lg.push('But it missed!');
        else {
          newHp = Math.max(0, c.player.currentHp - result.damage);
          if (result.critical) lg.push('A critical hit!');
          const eff = effectivenessText(result.effectiveness);
          if (eff) lg.push(eff.trim());
        }
        const stx = get();
        const newParty = stx.player.party.map((p) => (p.uid === c.player.uid ? { ...p, currentHp: newHp } : p));
        set({
          battle: { ...c, player: { ...c.player, currentHp: newHp }, log: lg, shake: !result.missed, attackerFlash: null },
          player: { ...stx.player, party: newParty },
        });
        setTimeout(() => set((s) => (s.battle ? { battle: { ...s.battle, shake: false } } : {})), 360);
        setTimeout(() => {
          const c2 = get().battle;
          if (!c2) return;
          if (c2.player.currentHp <= 0) finishDefeat();
          else performTurn();
        }, 700);
      }, 600);
    }
  },

  battleUseItem: (itemId) => {
    const b = get().battle;
    if (!b) return;
    const item = ITEMS[itemId];
    if (!item) return;
    if (item.category === 'capsule') {
      if (!b.isWild) {
        set({ battle: { ...b, log: [...b.log, 'You can\'t capture a trainer\'s Companion!'], phase: 'select-action' } });
        return;
      }
      get().consumeItem(itemId, 1);
      const result = attemptCapture(b.enemy, item.effect?.value ?? 1);
      const log = [...b.log, `You hurled a ${item.name}!`];
      for (let i = 0; i < Math.min(3, result.shakes); i++) log.push('… shake!');
      sfx.capture();
      set({ battle: { ...b, log, phase: 'capture-attempt', awaitingContinue: true } });
      setTimeout(() => {
        const cur = get().battle;
        if (!cur) return;
        if (result.success) {
          log.push(`Gotcha! ${SPECIES[cur.enemy.speciesId].name} was caught!`);
          set({ battle: { ...cur, log, phase: 'captured', awaitingContinue: true } });
        } else {
          log.push('Aw, it broke free!');
          // enemy turn after failed capture
          set({ battle: { ...cur, log, phase: 'select-action', awaitingContinue: false } });
        }
      }, 1200);
      return;
    }
    if (item.category === 'healing' || item.category === 'energy') {
      const stx = get();
      const active = stx.player.party.find((p) => p.uid === b.player.uid);
      if (!active) return;
      const healed = healInstance(active, item.effect?.value ?? 0);
      get().consumeItem(itemId, 1);
      const newPart = { ...b.player, currentHp: active.currentHp };
      set({
        battle: { ...b, player: newPart, log: [...b.log, `Used ${item.name}. Restored ${healed} HP.`] },
        player: { ...stx.player, party: stx.player.party.map((p) => (p.uid === active.uid ? active : p)) },
      });
    }
  },

  battleSwitch: (uid) => {
    const stx = get();
    const b = stx.battle;
    if (!b) return;
    const target = stx.player.party.find((p) => p.uid === uid);
    if (!target || target.currentHp <= 0 || target.uid === b.player.uid) return;
    // sync current battle player back to party HP
    const partyUpdated = stx.player.party.map((p) => (p.uid === b.player.uid ? { ...p, currentHp: b.player.currentHp } : p));
    set({
      player: { ...stx.player, party: partyUpdated },
      battle: { ...b, player: toBattleParticipant(target), log: [...b.log, `Come back!`, `Go, ${SPECIES[target.speciesId].name}!`], phase: 'select-action' },
    });
  },

  battleRun: () => {
    const b = get().battle;
    if (!b) return;
    if (!b.isWild) {
      set({ battle: { ...b, log: [...b.log, 'There\'s no running from a trainer!'], phase: 'select-action' } });
      return;
    }
    const odds = b.player.speed >= b.enemy.speed ? 0.95 : 0.6;
    if (Math.random() < odds) {
      set({ battle: { ...b, log: [...b.log, 'Got away safely!'], phase: 'fled', awaitingContinue: true } });
    } else {
      set({ battle: { ...b, log: [...b.log, 'Couldn\'t escape!'], phase: 'select-action' } });
    }
  },

  battleAdvance: () => {
    const b = get().battle;
    if (!b) return;
    if (b.phase === 'intro') {
      set({ battle: { ...b, phase: 'select-action', awaitingContinue: false } });
    } else if (b.phase === 'victory') {
      const trainer = b.trainerId ? TRAINERS[b.trainerId] : null;
      if (trainer && trainer.team[(b.trainerTeamIndex ?? 0) + 1]) return;
      if (b.isPvp && b.pvpEnemyTeam && b.pvpEnemyTeam[(b.pvpEnemyTeamIndex ?? 0) + 1]) return;
      get().endBattle('win');
    } else if (b.phase === 'fled') {
      get().endBattle('flee');
    } else if (b.phase === 'captured') {
      get().endBattle('caught');
    } else if (b.phase === 'defeat') {
      get().endBattle('lose');
    } else if (b.phase === 'capture-attempt') {
      // handled by timer; ignore
    }
  },

  endBattle: (outcome) => {
    const stx = get();
    const b = stx.battle;
    if (!b) return;
    const ach = useAchievements.getState().unlock;

    if (outcome === 'caught') {
      const captured: CreatureInstance = {
        uid: `c_${Date.now().toString(36)}_w`,
        speciesId: b.enemy.speciesId,
        level: b.enemy.level,
        xp: 0,
        currentHp: b.enemy.currentHp,
        moves: b.enemy.moves,
        shiny: b.enemy.shiny,
        iv: { hp: 8, attack: 8, defense: 8, speed: 8 },
      };
      const newParty = [...stx.player.party];
      const newStorage = [...stx.player.storage];
      if (newParty.length < PARTY_MAX) newParty.push(captured);
      else newStorage.push(captured);
      const speciesSet = stx.player.capturedSpecies.includes(captured.speciesId)
        ? stx.player.capturedSpecies
        : [...stx.player.capturedSpecies, captured.speciesId];
      const newPlayer = { ...stx.player, party: newParty, storage: newStorage, capturedSpecies: speciesSet };
      set({ player: newPlayer });
      const cap = newPlayer.quests.find((q) => q.id === 'q_capture');
      if (cap && !cap.steps[0].done) get().advanceQuest('q_capture', 0);
      sfx.captureSuccess();
      ach('first_capture');
      if (captured.shiny) ach('shiny_caught');
      if (SPECIES[captured.speciesId].rarity === 'legendary') ach('legendary');
      if (speciesSet.length >= 5) ach('collected_5');
      const totalSpecies = Object.keys(SPECIES).length;
      if (speciesSet.length >= totalSpecies) ach('collected_all');
      // capsule_lord: count total wild captures (storage + capturedSpecies count is a rough proxy)
      const totalCaught = newPlayer.party.length + newPlayer.storage.length;
      if (totalCaught >= 10) ach('capsule_lord');
      // Track per-species capture count + advance dynamic collect quests
      const cnt = { ...(stx.player.speciesCaptureCount ?? {}) };
      cnt[captured.speciesId] = (cnt[captured.speciesId] ?? 0) + 1;
      set({ player: { ...get().player, speciesCaptureCount: cnt } });
      const updatedQuests = get().player.quests.map((q) => {
        const dq = q as DynamicQuest;
        if (dq.type === 'collect' && dq.target?.speciesId === captured.speciesId && !q.completed) {
          const newProgress = (dq.progress ?? 0) + 1;
          const target = dq.target.count ?? 1;
          const steps = q.steps.map((s, i) => (i < newProgress ? { ...s, done: true } : s));
          const completed = newProgress >= target;
          if (completed) {
            sfx.achievement();
            get().showToast(`Quest complete: ${q.title}!`);
            get().giveItem('healingBerry', 3);
          }
          return { ...dq, steps, progress: newProgress, completed };
        }
        return q;
      });
      set({ player: { ...get().player, quests: updatedQuests } });
      // Boss capture
      if (b.isBoss && b.bossId) {
        const cur = get().player;
        if (!cur.capturedBosses.includes(b.bossId)) {
          set({ player: { ...cur, capturedBosses: [...cur.capturedBosses, b.bossId], defeatedBosses: [...cur.defeatedBosses, b.bossId] } });
        }
        // advance any boss quests
        const qs = get().player.quests.map((q) => {
          const dq = q as DynamicQuest;
          if (dq.type === 'defeat-boss' && !q.completed) {
            sfx.achievement();
            get().showToast(`Quest complete: ${q.title}!`);
            get().giveItem('energyPotion', 1);
            return { ...dq, completed: true, steps: q.steps.map((s) => ({ ...s, done: true })), progress: 1 };
          }
          return q;
        });
        set({ player: { ...get().player, quests: qs } });
      }
      get().showToast(`${SPECIES[captured.speciesId].name} added to your team!`);
    }
    if (outcome === 'win') {
      if (b.isWild) ach('first_battle_win');
      if (b.isTrainer && b.trainerId) {
        get().recordDefeatedTrainer(b.trainerId);
        const tq = stx.player.quests.find((q) => q.id === 'q_trainer');
        if (tq && !tq.completed) {
          get().advanceQuest('q_trainer', 0);
          get().completeQuest('q_trainer');
        }
        ach('first_trainer_win');
      }
      if (b.isPvp) {
        ach('pvp_winner');
        if (b.pvpKind === 'daily') {
          ach('daily_winner');
          saveDailyResult({ won: true, turns: b.pvpTurnsTaken ?? 0 });
        }
      }
      // Level achievements
      const top = stx.player.party.reduce((mx, p) => Math.max(mx, p.level), 0);
      if (top >= 10) ach('level_10');
      if (top >= 20) ach('level_20');
      // Boss defeated (without capture)
      if (b.isBoss && b.bossId) {
        const cur = get().player;
        if (!cur.defeatedBosses.includes(b.bossId)) {
          set({ player: { ...cur, defeatedBosses: [...cur.defeatedBosses, b.bossId] } });
        }
        const qs = get().player.quests.map((q) => {
          const dq = q as DynamicQuest;
          if (dq.type === 'defeat-boss' && !q.completed) {
            sfx.achievement();
            get().showToast(`Quest complete: ${q.title}!`);
            get().giveItem('energyPotion', 1);
            return { ...dq, completed: true, steps: q.steps.map((s) => ({ ...s, done: true })), progress: 1 };
          }
          return q;
        });
        set({ player: { ...get().player, quests: qs } });
      }
      // Level-up quest tracking
      const qs2 = get().player.quests.map((q) => {
        const dq = q as DynamicQuest;
        if (dq.type === 'level-up' && !q.completed && (dq.target?.level ?? 0) <= top) {
          sfx.achievement();
          get().showToast(`Quest complete: ${q.title}!`);
          get().giveItem('healingBerry', 5);
          return { ...dq, completed: true, steps: q.steps.map((s) => ({ ...s, done: true })), progress: 1 };
        }
        return q;
      });
      set({ player: { ...get().player, quests: qs2 } });
    }
    if (outcome === 'lose') {
      if (b.isPvp && b.pvpKind === 'daily') {
        saveDailyResult({ won: false, turns: b.pvpTurnsTaken ?? 0 });
      }
      // For PvP, don't reset position — just heal
      const newParty = stx.player.party.map((p) => {
        const max = maxHpFor(SPECIES[p.speciesId], p.level, p.iv.hp);
        return { ...p, currentHp: max };
      });
      const playerUpdate = b.isPvp
        ? { party: newParty }
        : { party: newParty, position: [0, 0, 6] as [number, number, number], facing: 0 };
      set({ player: { ...stx.player, ...playerUpdate } });
      get().showToast(b.isPvp ? 'A tough match! Train more and try again.' : 'You scurried home and recovered.');
    }
    if (outcome === 'flee') {
      sfx.cancel();
    }
    // After PvP, also fully heal party so they're ready for adventure
    if (b.isPvp) {
      const newParty = get().player.party.map((p) => {
        const max = maxHpFor(SPECIES[p.speciesId], p.level, p.iv.hp);
        return { ...p, currentHp: max };
      });
      set({ player: { ...get().player, party: newParty } });
    }
    set({ battle: null });
    get().fadeTo(b.isPvp ? 'versus' : 'overworld');
    setTimeout(() => get().save(), 600);
  },

  swapPartyOrder: (uidA, uidB) => {
    const st = get();
    const party = [...st.player.party];
    const a = party.findIndex((p) => p.uid === uidA);
    const b = party.findIndex((p) => p.uid === uidB);
    if (a < 0 || b < 0) return;
    [party[a], party[b]] = [party[b], party[a]];
    set({ player: { ...st.player, party } });
  },

  selectActive: (uid) => {
    const st = get();
    const party = [...st.player.party];
    const idx = party.findIndex((p) => p.uid === uid);
    if (idx <= 0) return;
    const [pick] = party.splice(idx, 1);
    party.unshift(pick);
    set({ player: { ...st.player, party } });
  },

  giveItem: (itemId, n) => {
    const st = get();
    const inv = [...st.player.inventory];
    const ex = inv.find((s) => s.itemId === itemId);
    if (ex) ex.count += n;
    else inv.push({ itemId, count: n });
    set({ player: { ...st.player, inventory: inv } });
  },

  consumeItem: (itemId, n = 1) => {
    const st = get();
    const inv = [...st.player.inventory];
    const ex = inv.find((s) => s.itemId === itemId);
    if (!ex || ex.count < n) return false;
    ex.count -= n;
    set({ player: { ...st.player, inventory: inv.filter((s) => s.count > 0) } });
    return true;
  },

  useItemOn: (itemId, uid) => {
    const st = get();
    const item = ITEMS[itemId];
    if (!item || (item.category !== 'healing' && item.category !== 'energy')) return false;
    const target = st.player.party.find((p) => p.uid === uid);
    if (!target) return false;
    const healed = healInstance(target, item.effect?.value ?? 0);
    if (healed <= 0) {
      get().showToast(`${SPECIES[target.speciesId].name} is at full health.`);
      return false;
    }
    get().consumeItem(itemId, 1);
    set({ player: { ...st.player, party: [...st.player.party] } });
    get().showToast(`Restored ${healed} HP to ${SPECIES[target.speciesId].name}.`);
    return true;
  },

  startQuest: (id) => {
    const st = get();
    if (st.player.quests.find((q) => q.id === id)) return;
    const tpl = QUEST_TEMPLATES[id];
    if (!tpl) return;
    const q: Quest = { ...tpl, completed: false, steps: tpl.steps.map((s) => ({ ...s })) };
    set({ player: { ...st.player, quests: [...st.player.quests, q] } });
  },

  advanceQuest: (id, stepIdx) => {
    const st = get();
    const quests = st.player.quests.map((q) => {
      if (q.id !== id) return q;
      const steps = q.steps.map((s, i) => (i === stepIdx ? { ...s, done: true } : s));
      return { ...q, steps };
    });
    set({ player: { ...st.player, quests } });
  },

  completeQuest: (id) => {
    const st = get();
    const quests = st.player.quests.map((q) =>
      q.id === id ? { ...q, completed: true, steps: q.steps.map((s) => ({ ...s, done: true })) } : q
    );
    set({ player: { ...st.player, quests } });
  },

  markNpcTriggered: (id) => {
    const st = get();
    if (st.player.triggeredNpcs.includes(id)) return;
    set({ player: { ...st.player, triggeredNpcs: [...st.player.triggeredNpcs, id] } });
  },

  recordDefeatedTrainer: (id) => {
    const st = get();
    if (st.player.defeatedTrainers.includes(id)) return;
    set({ player: { ...st.player, defeatedTrainers: [...st.player.defeatedTrainers, id] } });
  },

  resetSettings: (s) => {
    const st = get();
    const next = { ...st.settings, ...s };
    set({ settings: next });
    saveSettings(next);
  },

  travelToDimension: (dim) => {
    const stx = get();
    if (stx.player.dimension === dim) return;
    // Save current dim's position, restore destination's saved position
    const saved = { ...(stx.player.dimensionPositions ?? {}) };
    saved[stx.player.dimension] = stx.player.position;
    const destPos = saved[dim] ?? (dim === 'aetheria' ? [0, 0, 6] : [16, 0, 16]);
    const visited = stx.player.visitedDimensions.includes(dim) ? stx.player.visitedDimensions : [...stx.player.visitedDimensions, dim];
    set({
      player: {
        ...stx.player,
        dimension: dim,
        position: destPos as [number, number, number],
        dimensionPositions: saved,
        visitedDimensions: visited,
      },
    });
    // Advance any explore quest matching this dim
    for (const q of stx.player.quests) {
      const dq = q as DynamicQuest;
      if (dq.type === 'explore' && dq.target?.dimension === dim && !dq.completed) {
        get().advanceQuest(q.id, 0);
        get().completeQuest(q.id);
        get().showToast(`Quest complete: ${q.title}!`);
        get().giveItem('superCapsule', 2);
      }
    }
    sfx.evolve();
    get().fadeTo('overworld');
    get().showToast(`Entered ${dim.charAt(0).toUpperCase() + dim.slice(1)}.`);
    setTimeout(() => get().save(), 600);
  },

  generateNewQuest: () => {
    const stx = get();
    const maxLvl = stx.player.party.reduce((mx, p) => Math.max(mx, p.level), 1);
    const q = rollNewBoardQuest(maxLvl);
    set({ player: { ...stx.player, quests: [...stx.player.quests, q] } });
    sfx.confirm();
    get().showToast(`New quest: ${q.title}`);
  },

  refreshQuestBoard: () => {
    const stx = get();
    // Keep completed and main story quests; remove abandoned dynamic ones older than 5
    const keepStory = stx.player.quests.filter((q) => !(q as DynamicQuest).type || q.completed);
    const dyn = stx.player.quests.filter((q) => (q as DynamicQuest).type && !q.completed);
    const trimmed = dyn.slice(-3);
    set({ player: { ...stx.player, quests: [...keepStory, ...trimmed] } });
  },
}));

export function useActiveCreature(): CreatureInstance | undefined {
  return useGameStore((s) => s.player.party[0]);
}

export function partyAlive(): boolean {
  return useGameStore.getState().player.party.some((p) => p.currentHp > 0);
}

export { NPCS };

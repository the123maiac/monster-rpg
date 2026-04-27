export type ElementClass =
  | 'Flame'
  | 'Aqua'
  | 'Leaf'
  | 'Stone'
  | 'Spark'
  | 'Shadow'
  | 'Light'
  | 'Wind';

export type GameScreen =
  | 'main-menu'
  | 'starter-selection'
  | 'overworld'
  | 'battle'
  | 'dialogue'
  | 'party'
  | 'creature-details'
  | 'pause'
  | 'inventory'
  | 'quests'
  | 'settings'
  | 'versus'
  | 'achievements';

export interface Move {
  id: string;
  name: string;
  element: ElementClass;
  power: number;
  accuracy: number;
  description: string;
  category: 'physical' | 'special' | 'status';
}

export interface CreatureSpecies {
  id: string;
  name: string;
  element: ElementClass;
  secondaryElement?: ElementClass;
  description: string;
  baseStats: { hp: number; attack: number; defense: number; speed: number };
  moves: string[];
  captureDifficulty: number;
  evolvesInto?: string;
  evolveLevel?: number;
  geometry: 'sphere' | 'cube' | 'cone' | 'capsule' | 'octahedron' | 'torus' | 'pyramid';
  colorPrimary: string;
  colorSecondary: string;
  scale: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface CreatureInstance {
  uid: string;
  speciesId: string;
  nickname?: string;
  level: number;
  xp: number;
  currentHp: number;
  moves: string[];
  shiny: boolean;
  iv: { hp: number; attack: number; defense: number; speed: number };
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'capsule' | 'healing' | 'energy' | 'misc';
  effect?: { type: 'heal' | 'energy' | 'capture'; value: number };
}

export interface InventoryStack {
  itemId: string;
  count: number;
}

export interface NPCData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation?: number;
  color: string;
  hat?: string;
  dialogue: string[];
  postBattleDialogue?: string[];
  isTrainer?: boolean;
  trainerId?: string;
  quest?: { triggers: string; givesQuest?: string };
  oneTime?: boolean;
}

export interface TrainerData {
  id: string;
  name: string;
  team: { speciesId: string; level: number; moves?: string[] }[];
  rewardXp: number;
  victoryText: string;
  defeatText: string;
}

export interface QuestStep {
  id: string;
  text: string;
  done: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  steps: QuestStep[];
  reward?: string;
  completed: boolean;
}

export interface PlayerData {
  name: string;
  position: [number, number, number];
  facing: number;
  party: CreatureInstance[];
  storage: CreatureInstance[];
  inventory: InventoryStack[];
  defeatedTrainers: string[];
  triggeredNpcs: string[];
  quests: Quest[];
  capturedSpecies: string[];
  dimension: 'aetheria' | 'emberreach' | 'tidewell' | 'voidspire' | 'skyloft';
  dimensionPositions?: Partial<Record<'aetheria' | 'emberreach' | 'tidewell' | 'voidspire' | 'skyloft', [number, number, number]>>;
  defeatedBosses: string[];
  capturedBosses: string[];
  visitedDimensions: string[];
  speciesCaptureCount?: Record<string, number>;
}

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  textSpeed: 'slow' | 'normal' | 'fast';
}

export interface BattleAction {
  kind: 'move' | 'item' | 'switch' | 'capture' | 'run';
  moveId?: string;
  itemId?: string;
  switchToUid?: string;
}

export interface BattleParticipant {
  uid: string;
  speciesId: string;
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: string[];
  shiny: boolean;
}

export interface BattleState {
  active: boolean;
  isWild: boolean;
  isTrainer: boolean;
  isPvp?: boolean;
  pvpKind?: 'daily' | 'friend';
  pvpEnemyName?: string;
  pvpEnemyTeam?: BattleParticipant[];
  pvpEnemyTeamIndex?: number;
  pvpTurnsTaken?: number;
  isBoss?: boolean;
  bossId?: string;
  trainerId?: string;
  trainerTeamIndex?: number;
  player: BattleParticipant;
  enemy: BattleParticipant;
  log: string[];
  phase:
    | 'intro'
    | 'select-action'
    | 'select-move'
    | 'select-item'
    | 'select-switch'
    | 'animating'
    | 'capture-attempt'
    | 'enemy-turn'
    | 'victory'
    | 'defeat'
    | 'fled'
    | 'captured';
  awaitingContinue: boolean;
  attackerFlash: 'player' | 'enemy' | null;
  shake: boolean;
}

export interface DialogueState {
  active: boolean;
  npcId?: string;
  speakerName: string;
  lines: string[];
  index: number;
  onComplete?: () => void;
}

export interface SaveBlob {
  version: number;
  player: PlayerData;
  settings: Settings;
  savedAt: number;
}

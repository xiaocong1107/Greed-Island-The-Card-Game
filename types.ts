export enum CardRank {
  SS = 'SS',
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H'
}

export enum CardType {
  SPECIFIED = 'SPECIFIED', // Numbered 000-099
  SPELL = 'SPELL',         // Magic spells
  ITEM = 'ITEM',           // Random items converted to cards
  MONSTER = 'MONSTER'      // Monsters converted to cards
}

export enum GameState {
  IDLE = 'IDLE',
  DECISION = 'DECISION',
  RESOLVING = 'RESOLVING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  CHOOSING_REWARDS = 'CHOOSING_REWARDS'
}

export interface Card {
  id: string;
  number: number; // 0-99 for specified, others usually unnumbered or high numbers
  name: string;
  rank: CardRank;
  type: CardType;
  description: string;
  limit?: number; // Transformation limit
  imageUrl?: string; // Placeholder
}

export interface GameLog {
  id: string;
  text: string;
  sender: 'SYSTEM' | 'GM' | 'PLAYER';
  timestamp: number;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-10
  imageUrl: string;
}

export interface PlayerState {
  name: string;
  currentLocation: Location;
  specifiedSlots: (Card | null)[]; // Array of size 100
  freeSlots: (Card | null)[];      // Array of arbitrary size
  spellCards: Card[];              // Specifically spell cards held
  hp: number;
  maxHp: number;
  // RPG Stats
  level: number;
  xp: number;
  maxXp: number;
  attack: number;
  defense: number;
}

// New Interactive System Types

export interface Choice {
  id: string;
  text: string;
  type: 'AGGRESSIVE' | 'DEFENSIVE' | 'NEUTRAL' | 'RISKY';
}

export interface Scenario {
  title: string;
  description: string;
  choices: Choice[];
  monsterName?: string; // If applicable
  imageUrl?: string; // Optional scene override
}

export interface ActionResolution {
  narrative: string;
  damageTaken: number;
  xpGained: number;
  hpRestored: number;
  rewardCard?: {
    name: string;
    rank: string;
    type: string;
    description: string;
    number: number;
  };
  newStatBuff?: {
    stat: 'attack' | 'defense' | 'maxHp';
    amount: number;
    sourceName: string; // e.g. "Found Iron Sword"
  };
}

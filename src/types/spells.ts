import { GestureSequence, SpellDiscipline, GestureStep } from './gesture';

export type SpellCategory = 'ATTACK' | 'DEFENSE' | 'STATUS';
export type SpellEffectType = 'DAMAGE' | 'SHIELD' | 'SLOW' | 'STUN' | 'FREEZE' | 'BURN' | 'BLIND' | 'NONE';

export interface SpellEffect {
  type: SpellEffectType;
  value: number;
  duration: number;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  discipline: SpellDiscipline;
  category: SpellCategory;
  basePower: number; // Base power of the spell
  gestureComplexity: number; // 1-10 scale of how difficult the gesture is
  cooldown: number; // Time in ms before spell can be cast again
  duration?: number; // Duration of the spell effect in ms (for non-instant spells)
  statusEffect?: SpellEffectType; // Type of status effect for STATUS category spells
  visualEffects?: {
    castingEffect?: string;
    impactEffect?: string;
  };
}

export interface AttackSpell extends Spell {
  category: 'ATTACK';
  damageType: 'PHYSICAL' | 'MAGICAL' | 'ELEMENTAL';
  areaOfEffect: boolean;
  range: number; // In virtual units
  impactRadius?: number; // For AoE spells
}

export interface DefensiveSpell extends Spell {
  category: 'DEFENSE';
  defenseType: 'SHIELD' | 'BARRIER' | 'REFLECT';
  targetDiscipline?: SpellDiscipline; // For specific shields
  damageReduction: number;
}

export interface StatusSpell extends Spell {
  category: 'STATUS';
  effectType: SpellEffectType;
  effectStrength: number; // 0-1 scale
}

// Spell casting result
export interface SpellCastResult {
  spell?: Spell;
  success: boolean;
  failureReason?: string;
  accuracy: number; // How well the gesture was performed (0-1)
  effectivePower: number; // Actual power after accuracy is factored in
  isCritical?: boolean; // Whether this was a critical cast
  timestamp: number;
}

// Player spell book
export interface PlayerSpellbook {
  playerId: string;
  selectedSpells: Spell[];
  maxSpells: number;
  skillLevel: number; // Player's skill level with spells (0-1)
} 
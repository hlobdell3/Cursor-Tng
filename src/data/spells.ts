import { 
  Spell, 
  AttackSpell, 
  DefensiveSpell, 
  StatusSpell, 
  SpellCategory 
} from '../types/spells';
import { GestureStep, SpellDiscipline } from '../types/gesture';

// Helper function to create discipline-specific gesture steps
const createDisciplineGesture = (discipline: SpellDiscipline): GestureStep[] => {
  // For each discipline, we'll define a unique base gesture
  // These are simplified for example purposes
  // In a real implementation, these would be defined based on actual hand tracking data
  
  switch (discipline) {
    case 'FIRE':
      // Circular motion with right hand
      return [{
        handPositions: [{
          landmarks: [], // Would contain actual landmarks
          fingers: [
            { type: 'THUMB', joints: [], extended: true },
            { type: 'INDEX', joints: [], extended: true },
            { type: 'MIDDLE', joints: [], extended: true },
            { type: 'RING', joints: [], extended: true },
            { type: 'PINKY', joints: [], extended: true }
          ],
          palmPosition: { x: 0, y: 0, z: 0 },
          palmNormal: { x: 0, y: 0, z: 1 },
          handedness: 'Right'
        }],
        requiredAccuracy: 0.7
      }];
      
    case 'WATER':
      // Flowing wave motion with both hands
      return [{
        handPositions: [
          {
            landmarks: [],
            fingers: [
              { type: 'THUMB', joints: [], extended: false },
              { type: 'INDEX', joints: [], extended: true },
              { type: 'MIDDLE', joints: [], extended: true },
              { type: 'RING', joints: [], extended: true },
              { type: 'PINKY', joints: [], extended: true }
            ],
            palmPosition: { x: -0.2, y: 0, z: 0 },
            palmNormal: { x: 0, y: 0, z: 1 },
            handedness: 'Left'
          },
          {
            landmarks: [],
            fingers: [
              { type: 'THUMB', joints: [], extended: false },
              { type: 'INDEX', joints: [], extended: true },
              { type: 'MIDDLE', joints: [], extended: true },
              { type: 'RING', joints: [], extended: true },
              { type: 'PINKY', joints: [], extended: true }
            ],
            palmPosition: { x: 0.2, y: 0, z: 0 },
            palmNormal: { x: 0, y: 0, z: 1 },
            handedness: 'Right'
          }
        ],
        requiredAccuracy: 0.7
      }];
      
    case 'AIR':
      // Upward sweeping motion
      return [{
        handPositions: [{
          landmarks: [],
          fingers: [
            { type: 'THUMB', joints: [], extended: true },
            { type: 'INDEX', joints: [], extended: true },
            { type: 'MIDDLE', joints: [], extended: true },
            { type: 'RING', joints: [], extended: true },
            { type: 'PINKY', joints: [], extended: true }
          ],
          palmPosition: { x: 0, y: 0.3, z: 0 },
          palmNormal: { x: 0, y: 1, z: 0 },
          handedness: 'Right'
        }],
        requiredAccuracy: 0.7
      }];
      
    case 'EARTH':
      // Firm downward gesture
      return [{
        handPositions: [{
          landmarks: [],
          fingers: [
            { type: 'THUMB', joints: [], extended: true },
            { type: 'INDEX', joints: [], extended: false },
            { type: 'MIDDLE', joints: [], extended: false },
            { type: 'RING', joints: [], extended: false },
            { type: 'PINKY', joints: [], extended: false }
          ],
          palmPosition: { x: 0, y: -0.3, z: 0 },
          palmNormal: { x: 0, y: -1, z: 0 },
          handedness: 'Right'
        }],
        requiredAccuracy: 0.7
      }];
      
    case 'LIGHTNING':
      // Zigzag motion
      return [{
        handPositions: [{
          landmarks: [],
          fingers: [
            { type: 'THUMB', joints: [], extended: false },
            { type: 'INDEX', joints: [], extended: true },
            { type: 'MIDDLE', joints: [], extended: false },
            { type: 'RING', joints: [], extended: false },
            { type: 'PINKY', joints: [], extended: false }
          ],
          palmPosition: { x: 0, y: 0, z: 0 },
          palmNormal: { x: 0, y: 0, z: 1 },
          handedness: 'Right'
        }],
        requiredAccuracy: 0.7
      }];
      
    case 'SHADOW':
      // Crossed arms
      return [{
        handPositions: [
          {
            landmarks: [],
            fingers: [
              { type: 'THUMB', joints: [], extended: false },
              { type: 'INDEX', joints: [], extended: false },
              { type: 'MIDDLE', joints: [], extended: false },
              { type: 'RING', joints: [], extended: false },
              { type: 'PINKY', joints: [], extended: false }
            ],
            palmPosition: { x: 0.2, y: 0, z: 0 },
            palmNormal: { x: -1, y: 0, z: 0 },
            handedness: 'Left'
          },
          {
            landmarks: [],
            fingers: [
              { type: 'THUMB', joints: [], extended: false },
              { type: 'INDEX', joints: [], extended: false },
              { type: 'MIDDLE', joints: [], extended: false },
              { type: 'RING', joints: [], extended: false },
              { type: 'PINKY', joints: [], extended: false }
            ],
            palmPosition: { x: -0.2, y: 0, z: 0 },
            palmNormal: { x: 1, y: 0, z: 0 },
            handedness: 'Right'
          }
        ],
        requiredAccuracy: 0.7
      }];
  }
};

// Attack Spells
export const attackSpells: AttackSpell[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'A ball of fire that explodes on impact, damaging enemies in a small radius.',
    discipline: SpellDiscipline.FIRE,
    category: 'ATTACK',
    basePower: 50,
    gestureComplexity: 3,
    cooldown: 2000,
    damageType: 'ELEMENTAL',
    areaOfEffect: true,
    range: 20,
    impactRadius: 5,
    visualEffects: {
      castingEffect: 'fireball-casting',
      impactEffect: 'fireball-impact'
    }
  },
  {
    id: 'iceSpike',
    name: 'Ice Spike',
    description: 'Launches a sharp spike of ice that pierces through enemies.',
    discipline: SpellDiscipline.WATER,
    category: 'ATTACK',
    basePower: 40,
    gestureComplexity: 2,
    cooldown: 1500,
    damageType: 'ELEMENTAL',
    areaOfEffect: false,
    range: 25,
    visualEffects: {
      castingEffect: 'ice-spike-casting',
      impactEffect: 'ice-spike-impact'
    }
  },
  {
    id: 'lightningBolt',
    name: 'Lightning Bolt',
    description: 'Calls down a powerful bolt of lightning that can chain to nearby enemies.',
    discipline: SpellDiscipline.LIGHTNING,
    category: 'ATTACK',
    basePower: 55,
    gestureComplexity: 4,
    cooldown: 3000,
    damageType: 'ELEMENTAL',
    areaOfEffect: true,
    range: 15,
    impactRadius: 8,
    visualEffects: {
      castingEffect: 'lightning-bolt-casting',
      impactEffect: 'lightning-bolt-impact'
    }
  },
  {
    id: 'rockThrow',
    name: 'Rock Throw',
    description: 'Hurls a large boulder that crushes enemies with physical force.',
    discipline: SpellDiscipline.EARTH,
    category: 'ATTACK',
    basePower: 45,
    gestureComplexity: 2,
    cooldown: 2500,
    damageType: 'PHYSICAL',
    areaOfEffect: false,
    range: 12,
    visualEffects: {
      castingEffect: 'rock-throw-casting',
      impactEffect: 'rock-throw-impact'
    }
  },
  {
    id: 'shadowStrike',
    name: 'Shadow Strike',
    description: 'Summons shadowy tendrils that strike from multiple angles.',
    discipline: SpellDiscipline.SHADOW,
    category: 'ATTACK',
    basePower: 35,
    gestureComplexity: 3,
    cooldown: 2000,
    damageType: 'MAGICAL',
    areaOfEffect: false,
    range: 15,
    visualEffects: {
      castingEffect: 'shadow-strike-casting',
      impactEffect: 'shadow-strike-impact'
    }
  },
  {
    id: 'airBlast',
    name: 'Air Blast',
    description: 'Creates a powerful blast of air that knocks enemies back.',
    discipline: SpellDiscipline.AIR,
    category: 'ATTACK',
    basePower: 30,
    gestureComplexity: 2,
    cooldown: 1500,
    damageType: 'PHYSICAL',
    areaOfEffect: true,
    range: 10,
    impactRadius: 6,
    visualEffects: {
      castingEffect: 'air-blast-casting',
      impactEffect: 'air-blast-impact'
    }
  }
];

// Defensive Spells
export const defensiveSpells: DefensiveSpell[] = [
  {
    id: 'stoneShield',
    name: 'Stone Shield',
    description: 'Creates a shield of solid stone that reduces incoming damage.',
    discipline: SpellDiscipline.EARTH,
    category: 'DEFENSE',
    basePower: 60,
    gestureComplexity: 3,
    cooldown: 5000,
    duration: 8000,
    defenseType: 'SHIELD',
    damageReduction: 0.5,
    visualEffects: {
      castingEffect: 'stone-shield-casting',
      impactEffect: 'stone-shield-active'
    }
  },
  {
    id: 'waterBarrier',
    name: 'Water Barrier',
    description: 'Surrounds you with a barrier of water that absorbs fire damage.',
    discipline: SpellDiscipline.WATER,
    category: 'DEFENSE',
    basePower: 40,
    gestureComplexity: 2,
    cooldown: 4000,
    duration: 10000,
    defenseType: 'BARRIER',
    targetDiscipline: SpellDiscipline.FIRE,
    damageReduction: 0.8,
    visualEffects: {
      castingEffect: 'water-barrier-casting',
      impactEffect: 'water-barrier-active'
    }
  },
  {
    id: 'lightningReflect',
    name: 'Lightning Reflect',
    description: 'Creates an electrical field that reflects some damage back to attackers.',
    discipline: SpellDiscipline.LIGHTNING,
    category: 'DEFENSE',
    basePower: 35,
    gestureComplexity: 4,
    cooldown: 6000,
    duration: 6000,
    defenseType: 'REFLECT',
    damageReduction: 0.3,
    visualEffects: {
      castingEffect: 'lightning-reflect-casting',
      impactEffect: 'lightning-reflect-active'
    }
  },
  {
    id: 'shadowCloak',
    name: 'Shadow Cloak',
    description: 'Wraps you in shadows, reducing the accuracy of enemy spells.',
    discipline: SpellDiscipline.SHADOW,
    category: 'DEFENSE',
    basePower: 30,
    gestureComplexity: 3,
    cooldown: 8000,
    duration: 12000,
    defenseType: 'BARRIER',
    damageReduction: 0.2,
    visualEffects: {
      castingEffect: 'shadow-cloak-casting',
      impactEffect: 'shadow-cloak-active'
    }
  }
];

// Status Effect Spells
export const statusSpells: StatusSpell[] = [
  {
    id: 'shadowBlindness',
    name: 'Shadow Blindness',
    description: 'Covers the enemy in shadows, temporarily blinding them.',
    discipline: SpellDiscipline.SHADOW,
    category: 'STATUS',
    basePower: 30,
    gestureComplexity: 3,
    cooldown: 10000,
    duration: 4000,
    effectType: 'BLIND',
    effectStrength: 0.8,
    statusEffect: 'BLIND',
    visualEffects: {
      castingEffect: 'shadow-blindness-casting',
      impactEffect: 'shadow-blindness-impact'
    }
  },
  {
    id: 'iceFreeze',
    name: 'Ice Freeze',
    description: 'Freezes the target in place, preventing movement and slowing casting.',
    discipline: SpellDiscipline.WATER,
    category: 'STATUS',
    basePower: 35,
    gestureComplexity: 4,
    cooldown: 12000,
    duration: 3000,
    effectType: 'FREEZE',
    effectStrength: 0.9,
    statusEffect: 'FREEZE',
    visualEffects: {
      castingEffect: 'ice-freeze-casting',
      impactEffect: 'ice-freeze-impact'
    }
  },
  {
    id: 'fireBurn',
    name: 'Fire Burn',
    description: 'Sets the target on fire, causing damage over time.',
    discipline: SpellDiscipline.FIRE,
    category: 'STATUS',
    basePower: 25,
    gestureComplexity: 2,
    cooldown: 8000,
    duration: 6000,
    effectType: 'BURN',
    effectStrength: 0.7,
    statusEffect: 'BURN',
    visualEffects: {
      castingEffect: 'fire-burn-casting',
      impactEffect: 'fire-burn-impact'
    }
  },
  {
    id: 'airSlow',
    name: 'Air Slow',
    description: 'Creates air resistance around the target, slowing their movements.',
    discipline: SpellDiscipline.AIR,
    category: 'STATUS',
    basePower: 20,
    gestureComplexity: 2,
    cooldown: 7000,
    duration: 8000,
    effectType: 'SLOW',
    effectStrength: 0.5,
    statusEffect: 'SLOW',
    visualEffects: {
      castingEffect: 'air-slow-casting',
      impactEffect: 'air-slow-impact'
    }
  },
  {
    id: 'earthStun',
    name: 'Earth Stun',
    description: 'Strikes the ground, creating a shockwave that stuns enemies.',
    discipline: SpellDiscipline.EARTH,
    category: 'STATUS',
    basePower: 40,
    gestureComplexity: 3,
    cooldown: 15000,
    duration: 2000,
    effectType: 'STUN',
    effectStrength: 1.0,
    statusEffect: 'STUN',
    visualEffects: {
      castingEffect: 'earth-stun-casting',
      impactEffect: 'earth-stun-impact'
    }
  }
];

// Combine all spells into one array
export const allSpells: Spell[] = [
  ...attackSpells,
  ...defensiveSpells,
  ...statusSpells
];

// Get spells by discipline
export const getSpellsByDiscipline = (discipline: SpellDiscipline): Spell[] => {
  return allSpells.filter(spell => spell.discipline === discipline);
};

// Get spells by category
export const getSpellsByCategory = (category: SpellCategory): Spell[] => {
  return allSpells.filter(spell => spell.category === category);
}; 
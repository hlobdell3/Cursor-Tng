import { Gesture, GestureSequence, SpellDiscipline } from '../types/gesture';
import { Spell, SpellCategory, SpellCastResult, SpellEffect } from '../types/spells';
import { AssetLoader } from './AssetLoader';

/**
 * Class to manage spell definitions, casting, and effects
 */
export class SpellManager {
  private static instance: SpellManager;
  private spells: Spell[] = [];
  private assetLoader: AssetLoader;
  
  // Private constructor for singleton pattern
  private constructor() {
    this.assetLoader = AssetLoader.getInstance();
  }
  
  /**
   * Get the SpellManager singleton instance
   */
  public static getInstance(): SpellManager {
    if (!SpellManager.instance) {
      SpellManager.instance = new SpellManager();
    }
    return SpellManager.instance;
  }
  
  /**
   * Register spells with the manager
   */
  public registerSpells(spells: Spell[]): void {
    this.spells = [...spells];
    console.log(`Registered ${spells.length} spells`);
  }
  
  /**
   * Get all registered spells
   */
  public getAllSpells(): Spell[] {
    return [...this.spells];
  }
  
  /**
   * Get spells of a specific category
   */
  public getSpellsByCategory(category: SpellCategory): Spell[] {
    return this.spells.filter(spell => spell.category === category);
  }
  
  /**
   * Get spells of a specific discipline
   */
  public getSpellsByDiscipline(discipline: SpellDiscipline): Spell[] {
    return this.spells.filter(spell => spell.discipline === discipline);
  }
  
  /**
   * Find a spell by ID
   */
  public getSpellById(id: string): Spell | undefined {
    return this.spells.find(spell => spell.id === id);
  }
  
  /**
   * Preload spell assets
   */
  public async preloadSpellAssets(): Promise<void> {
    const disciplines = Object.values(SpellDiscipline);
    await this.assetLoader.preloadCommonAssets(
      disciplines.map(d => d.toString()),
      this.spells
    );
  }
  
  /**
   * Cast a spell based on detected gesture sequence
   */
  public castSpell(
    detectedSequence: GestureSequence,
    playerSkill: number,
    environmentalFactors: { [key: string]: number } = {}
  ): SpellCastResult {
    // Find the spell that matches this gesture sequence
    const matchedSpell = this.findSpellByGestureSequence(detectedSequence);
    
    if (!matchedSpell) {
      return this.createFailedCastResult('No matching spell found');
    }
    
    // Calculate accuracy based on gesture sequence match score
    const baseAccuracy = detectedSequence.score || 0.5;
    
    // Apply player skill modifier (0-1 value representing player skill level)
    const skillModifier = 0.5 + (playerSkill * 0.5); // 0.5-1.0 range
    
    // Apply environmental factors if any (e.g., weather conditions, location effects)
    let environmentalModifier = 1.0;
    if (environmentalFactors) {
      // Example: fire spells are stronger in hot environments
      if (matchedSpell.discipline === SpellDiscipline.FIRE && environmentalFactors.temperature) {
        environmentalModifier += (environmentalFactors.temperature - 0.5) * 0.4;
      }
      // Example: water spells are stronger near water sources
      if (matchedSpell.discipline === SpellDiscipline.WATER && environmentalFactors.humidity) {
        environmentalModifier += environmentalFactors.humidity * 0.3;
      }
    }
    
    // Calculate final accuracy (capped at 0-1)
    const accuracy = Math.min(1.0, Math.max(0, baseAccuracy * skillModifier));
    
    // Calculate spell power based on base power, accuracy, and environmental modifiers
    const effectivePower = matchedSpell.basePower * accuracy * environmentalModifier;
    
    // Determine if the spell was critical (based on accuracy and some randomness)
    const criticalThreshold = 0.85;
    const criticalRandom = Math.random() * 0.15; // Random factor
    const isCritical = accuracy > criticalThreshold && criticalRandom > 0.1;
    
    // If critical, boost the effective power
    const finalPower = isCritical ? effectivePower * 1.5 : effectivePower;
    
    // Return the cast result
    return {
      spell: matchedSpell,
      success: true,
      accuracy,
      effectivePower: finalPower,
      isCritical,
      timestamp: Date.now()
    };
  }
  
  /**
   * Find a spell that matches a gesture sequence
   */
  private findSpellByGestureSequence(sequence: GestureSequence): Spell | undefined {
    // In a real implementation, we'd have a more sophisticated matching algorithm
    // For now, just match by discipline and gesture count as a simplification
    return this.spells.find(spell => 
      spell.discipline === sequence.disciplineKey &&
      spell.gestureComplexity === sequence.gestures.length
    );
  }
  
  /**
   * Create a failed spell cast result
   */
  private createFailedCastResult(reason: string): SpellCastResult {
    return {
      success: false,
      accuracy: 0,
      effectivePower: 0,
      failureReason: reason,
      timestamp: Date.now()
    };
  }
  
  /**
   * Apply a spell effect to a target
   */
  public applySpellEffect(
    castResult: SpellCastResult,
    targetId: string,
    currentState: any // This would be a game state object in a real implementation
  ): { newState: any; appliedEffect: SpellEffect } {
    if (!castResult.success || !castResult.spell) {
      return { 
        newState: currentState,
        appliedEffect: { 
          type: 'NONE',
          value: 0,
          duration: 0 
        }
      };
    }
    
    const spell = castResult.spell;
    const power = castResult.effectivePower;
    
    // Clone the current state to avoid direct modification
    const newState = { ...currentState };
    
    // Apply different effects based on spell category
    switch (spell.category) {
      case 'ATTACK':
        // Deal damage to target
        if (!newState.entities) newState.entities = {};
        if (newState.entities[targetId]) {
          newState.entities[targetId].health -= power;
        }
        return {
          newState,
          appliedEffect: {
            type: 'DAMAGE',
            value: power,
            duration: 0
          }
        };
        
      case 'DEFENSE':
        // Add shield to caster
        if (!newState.playerEffects) newState.playerEffects = [];
        newState.playerEffects.push({
          type: 'SHIELD',
          value: power,
          duration: spell.duration || 3000, // Default to 3 seconds if not specified
          startTime: Date.now()
        });
        return {
          newState,
          appliedEffect: {
            type: 'SHIELD',
            value: power,
            duration: spell.duration || 3000
          }
        };
        
      case 'STATUS':
        // Apply status effect to target
        if (!newState.entities) newState.entities = {};
        if (newState.entities[targetId]) {
          if (!newState.entities[targetId].statusEffects) {
            newState.entities[targetId].statusEffects = [];
          }
          newState.entities[targetId].statusEffects.push({
            type: spell.statusEffect || 'NONE',
            value: power,
            duration: spell.duration || 5000, // Default to 5 seconds
            startTime: Date.now()
          });
        }
        return {
          newState,
          appliedEffect: {
            type: spell.statusEffect || 'NONE',
            value: power,
            duration: spell.duration || 5000
          }
        };
        
      default:
        return {
          newState,
          appliedEffect: {
            type: 'NONE',
            value: 0,
            duration: 0
          }
        };
    }
  }
} 
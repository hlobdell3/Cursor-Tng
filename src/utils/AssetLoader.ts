import { AssetPlaceholder } from './AssetPlaceholder';

// Types for different asset categories
export type AssetType = 'discipline' | 'demonstration' | 'effect';
export type EffectType = 'casting' | 'impact';

interface AssetCache {
  disciplines: Record<string, string>;
  demonstrations: Record<string, string>;
  effects: Record<string, {
    casting?: string;
    impact?: string;
  }>;
}

/**
 * Utility class for loading and managing game assets
 * Handles both real assets (when available) and fallback to placeholders
 */
export class AssetLoader {
  private static instance: AssetLoader;
  private cache: AssetCache = {
    disciplines: {},
    demonstrations: {},
    effects: {}
  };
  private usePlaceholders: boolean = false;
  private assetsBaseUrl: string = '/assets';
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance of AssetLoader
   */
  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }
  
  /**
   * Configure the asset loader
   */
  public configure(options: {
    usePlaceholders?: boolean;
    assetsBaseUrl?: string;
  }): void {
    if (options.usePlaceholders !== undefined) {
      this.usePlaceholders = options.usePlaceholders;
    }
    
    if (options.assetsBaseUrl) {
      this.assetsBaseUrl = options.assetsBaseUrl;
    }
  }
  
  /**
   * Get base URL for asset type
   */
  private getBaseUrl(type: AssetType): string {
    return `${this.assetsBaseUrl}/${type}s`;
  }
  
  /**
   * Check if a file exists at the given URL
   */
  private async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Get discipline asset (visual cue/icon for discipline)
   */
  public async getDisciplineAsset(discipline: string): Promise<string> {
    const disciplineLower = discipline.toLowerCase();
    
    // Return from cache if available
    if (this.cache.disciplines[disciplineLower]) {
      return this.cache.disciplines[disciplineLower];
    }
    
    // Try to load real asset
    if (!this.usePlaceholders) {
      const assetUrl = `${this.getBaseUrl('discipline')}/${disciplineLower}.gif`;
      const exists = await this.fileExists(assetUrl);
      
      if (exists) {
        this.cache.disciplines[disciplineLower] = assetUrl;
        return assetUrl;
      }
    }
    
    // Generate placeholder as fallback
    console.log(`Using placeholder for discipline: ${discipline}`);
    const canvas = AssetPlaceholder.createDisciplinePlaceholder(discipline);
    const dataUrl = AssetPlaceholder.canvasToDataURL(canvas);
    
    this.cache.disciplines[disciplineLower] = dataUrl;
    return dataUrl;
  }
  
  /**
   * Get demonstration asset (video showing how to perform gesture)
   */
  public async getDemonstrationAsset(spellName: string): Promise<string> {
    const spellKey = spellName.toLowerCase().replace(/\s+/g, '-');
    
    // Return from cache if available
    if (this.cache.demonstrations[spellKey]) {
      return this.cache.demonstrations[spellKey];
    }
    
    // Try to load real asset
    if (!this.usePlaceholders) {
      const assetUrl = `${this.getBaseUrl('demonstration')}/${spellKey}.mp4`;
      const exists = await this.fileExists(assetUrl);
      
      if (exists) {
        this.cache.demonstrations[spellKey] = assetUrl;
        return assetUrl;
      }
    }
    
    // For demonstrations, we don't have a placeholder generator yet
    // Return a generic URL that the component can handle
    const placeholderUrl = '/placeholder-demonstration.mp4';
    this.cache.demonstrations[spellKey] = placeholderUrl;
    
    return placeholderUrl;
  }
  
  /**
   * Get spell effect asset (visual effect for casting or impact)
   */
  public async getEffectAsset(
    spellName: string, 
    type: EffectType
  ): Promise<string> {
    const spellKey = spellName.toLowerCase().replace(/\s+/g, '-');
    
    // Return from cache if available
    if (this.cache.effects[spellKey]?.[type]) {
      return this.cache.effects[spellKey][type]!;
    }
    
    // Initialize spell in effects cache if needed
    if (!this.cache.effects[spellKey]) {
      this.cache.effects[spellKey] = {};
    }
    
    // Try to load real asset
    if (!this.usePlaceholders) {
      const assetUrl = `${this.getBaseUrl('effect')}/${spellKey}-${type}.gif`;
      const exists = await this.fileExists(assetUrl);
      
      if (exists) {
        this.cache.effects[spellKey][type] = assetUrl;
        return assetUrl;
      }
    }
    
    // Generate placeholder as fallback
    console.log(`Using placeholder for spell effect: ${spellName} (${type})`);
    const canvas = AssetPlaceholder.createSpellEffectPlaceholder(spellName, type);
    const dataUrl = AssetPlaceholder.canvasToDataURL(canvas);
    
    this.cache.effects[spellKey][type] = dataUrl;
    return dataUrl;
  }
  
  /**
   * Preload common assets to avoid delays during gameplay
   */
  public async preloadCommonAssets(
    disciplines: string[],
    spells: { name: string; discipline: string }[]
  ): Promise<void> {
    // Create load promises for all assets
    const loadPromises: Promise<void>[] = [];
    
    // Preload discipline assets
    disciplines.forEach(discipline => {
      loadPromises.push(
        this.getDisciplineAsset(discipline).then(() => {})
      );
    });
    
    // Preload spell effects
    spells.forEach(spell => {
      loadPromises.push(
        this.getEffectAsset(spell.name, 'casting').then(() => {})
      );
      loadPromises.push(
        this.getEffectAsset(spell.name, 'impact').then(() => {})
      );
    });
    
    // Wait for all assets to load
    await Promise.all(loadPromises);
    console.log('Preloaded common assets');
  }
  
  /**
   * Clear the asset cache
   */
  public clearCache(): void {
    this.cache = {
      disciplines: {},
      demonstrations: {},
      effects: {}
    };
  }
} 
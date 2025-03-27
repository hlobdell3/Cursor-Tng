import React, { useEffect, useState } from 'react';
import { AssetLoader, EffectType } from '../utils/AssetLoader';

interface AssetLoaderDemoProps {
  usePlaceholders?: boolean;
}

export const AssetLoaderDemo: React.FC<AssetLoaderDemoProps> = ({ 
  usePlaceholders = true 
}) => {
  const [disciplines] = useState(['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow']);
  const [spells] = useState([
    { name: 'Fireball', discipline: 'Fire' },
    { name: 'Water Shield', discipline: 'Water' },
    { name: 'Lightning Bolt', discipline: 'Lightning' }
  ]);
  
  const [selectedDiscipline, setSelectedDiscipline] = useState(disciplines[0]);
  const [selectedSpell, setSelectedSpell] = useState(spells[0].name);
  const [effectType, setEffectType] = useState<EffectType>('casting');
  
  const [disciplineAsset, setDisciplineAsset] = useState<string | null>(null);
  const [effectAsset, setEffectAsset] = useState<string | null>(null);
  const [demoAsset, setDemoAsset] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Configure AssetLoader
    const assetLoader = AssetLoader.getInstance();
    assetLoader.configure({
      usePlaceholders,
      assetsBaseUrl: '/assets'
    });
    
    // Preload assets when component mounts
    const preloadAssets = async () => {
      setIsLoading(true);
      try {
        await assetLoader.preloadCommonAssets(disciplines, spells);
      } finally {
        setIsLoading(false);
      }
    };
    
    preloadAssets();
  }, [disciplines, spells, usePlaceholders]);
  
  useEffect(() => {
    const loadDisciplineAsset = async () => {
      setIsLoading(true);
      try {
        const assetLoader = AssetLoader.getInstance();
        const asset = await assetLoader.getDisciplineAsset(selectedDiscipline);
        setDisciplineAsset(asset);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDisciplineAsset();
  }, [selectedDiscipline]);
  
  useEffect(() => {
    const loadEffectAsset = async () => {
      setIsLoading(true);
      try {
        const assetLoader = AssetLoader.getInstance();
        const asset = await assetLoader.getEffectAsset(selectedSpell, effectType);
        setEffectAsset(asset);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEffectAsset();
  }, [selectedSpell, effectType]);
  
  useEffect(() => {
    const loadDemoAsset = async () => {
      setIsLoading(true);
      try {
        const assetLoader = AssetLoader.getInstance();
        const asset = await assetLoader.getDemonstrationAsset(selectedSpell);
        setDemoAsset(asset);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDemoAsset();
  }, [selectedSpell]);
  
  const handleDisciplineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDiscipline(e.target.value);
  };
  
  const handleSpellChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpell(e.target.value);
  };
  
  const handleEffectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEffectType(e.target.value as EffectType);
  };
  
  return (
    <div className="asset-loader-demo">
      <h2>Asset Loader Demonstration</h2>
      <p>
        This component demonstrates how the AssetLoader works to load real assets
        or generate placeholders when needed.
      </p>
      
      {isLoading && <div className="loading">Loading assets...</div>}
      
      <div className="demo-controls">
        <div className="control-group">
          <label>
            Discipline:
            <select value={selectedDiscipline} onChange={handleDisciplineChange}>
              {disciplines.map(disc => (
                <option key={disc} value={disc}>{disc}</option>
              ))}
            </select>
          </label>
          
          <div className="asset-display">
            <h4>Discipline Asset:</h4>
            {disciplineAsset && (
              <img 
                src={disciplineAsset} 
                alt={`${selectedDiscipline} discipline`}
                className="asset-image"
              />
            )}
          </div>
        </div>
        
        <div className="control-group">
          <label>
            Spell:
            <select value={selectedSpell} onChange={handleSpellChange}>
              {spells.map(spell => (
                <option key={spell.name} value={spell.name}>{spell.name}</option>
              ))}
            </select>
          </label>
          
          <label>
            Effect Type:
            <select value={effectType} onChange={handleEffectTypeChange}>
              <option value="casting">Casting</option>
              <option value="impact">Impact</option>
            </select>
          </label>
          
          <div className="asset-display">
            <h4>Spell Effect Asset:</h4>
            {effectAsset && (
              <img 
                src={effectAsset} 
                alt={`${selectedSpell} ${effectType} effect`}
                className="asset-image"
              />
            )}
          </div>
        </div>
        
        <div className="control-group">
          <h4>Spell Demonstration:</h4>
          {demoAsset && demoAsset !== '/placeholder-demonstration.mp4' ? (
            <video 
              src={demoAsset} 
              controls
              width="320"
              height="240"
              className="video-asset"
            />
          ) : (
            <div className="placeholder-video">
              <p>Demonstration video placeholder for {selectedSpell}</p>
              <p className="note">
                (Real demo videos would be loaded here when available)
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="code-example">
        <h4>How to use AssetLoader in your components:</h4>
        <pre>
{`// Get the singleton instance
const assetLoader = AssetLoader.getInstance();

// Configure it (typically done at app initialization)
assetLoader.configure({
  usePlaceholders: true, // Use placeholders when real assets not found
  assetsBaseUrl: '/assets'
});

// Load a discipline asset
const disciplineAsset = await assetLoader.getDisciplineAsset('Fire');

// Load a spell effect
const effectAsset = await assetLoader.getEffectAsset('Fireball', 'casting');

// Load a demonstration
const demoAsset = await assetLoader.getDemonstrationAsset('Fireball');`}
        </pre>
      </div>
      
      <style jsx>{`
        .asset-loader-demo {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .loading {
          padding: 10px;
          margin: 10px 0;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          color: #856404;
        }
        
        .demo-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 20px 0;
        }
        
        .control-group {
          padding: 15px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        label {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
          font-weight: bold;
        }
        
        select {
          margin-top: 5px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          width: 200px;
        }
        
        .asset-display {
          margin-top: 15px;
        }
        
        .asset-image {
          display: block;
          max-width: 200px;
          max-height: 200px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #eee;
        }
        
        .placeholder-video {
          width: 320px;
          height: 240px;
          background: #333;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 4px;
        }
        
        .note {
          font-size: 12px;
          opacity: 0.7;
        }
        
        .code-example {
          margin-top: 30px;
          background: #e9f5ff;
          padding: 15px;
          border-radius: 6px;
        }
        
        pre {
          background: #333;
          color: #fff;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}; 
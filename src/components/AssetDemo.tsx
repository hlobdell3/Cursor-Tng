import React, { useEffect, useRef, useState } from 'react';
import { AssetPlaceholder } from '../utils/AssetPlaceholder';

interface AssetDemoProps {
  showAll?: boolean;
}

export const AssetDemo: React.FC<AssetDemoProps> = ({ showAll = false }) => {
  const [disciplines] = useState(['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow']);
  const [selectedDiscipline, setSelectedDiscipline] = useState('Fire');
  const [spellName, setSpellName] = useState('Fireball');
  const [effectType, setEffectType] = useState<'casting' | 'impact'>('casting');
  
  const disciplineRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (disciplineRef.current) {
      disciplineRef.current.innerHTML = '';
      
      if (showAll) {
        // Show all disciplines
        disciplines.forEach(discipline => {
          const canvas = AssetPlaceholder.createDisciplinePlaceholder(discipline);
          const img = document.createElement('img');
          img.src = AssetPlaceholder.canvasToDataURL(canvas);
          img.style.margin = '10px';
          img.style.width = '150px';
          img.style.height = '150px';
          disciplineRef.current?.appendChild(img);
        });
      } else {
        // Show selected discipline
        const canvas = AssetPlaceholder.createDisciplinePlaceholder(selectedDiscipline);
        const img = document.createElement('img');
        img.src = AssetPlaceholder.canvasToDataURL(canvas);
        img.style.width = '200px';
        img.style.height = '200px';
        disciplineRef.current?.appendChild(img);
      }
    }
  }, [disciplines, selectedDiscipline, showAll]);
  
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.innerHTML = '';
      
      const canvas = AssetPlaceholder.createSpellEffectPlaceholder(spellName, effectType);
      const img = document.createElement('img');
      img.src = AssetPlaceholder.canvasToDataURL(canvas);
      img.style.width = '200px';
      img.style.height = '200px';
      effectRef.current?.appendChild(img);
    }
  }, [spellName, effectType]);
  
  return (
    <div className="asset-demo">
      <h2>Asset Placeholder Demo</h2>
      
      <div className="demo-section">
        <h3>Discipline Placeholders</h3>
        {!showAll && (
          <div className="controls">
            <label>
              Select Discipline:
              <select 
                value={selectedDiscipline} 
                onChange={(e) => setSelectedDiscipline(e.target.value)}
              >
                {disciplines.map(disc => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="placeholder-container" ref={disciplineRef}></div>
      </div>
      
      <div className="demo-section">
        <h3>Spell Effect Placeholders</h3>
        <div className="controls">
          <label>
            Spell Name:
            <input 
              type="text" 
              value={spellName} 
              onChange={(e) => setSpellName(e.target.value)}
            />
          </label>
          <label>
            Effect Type:
            <select 
              value={effectType} 
              onChange={(e) => setEffectType(e.target.value as 'casting' | 'impact')}
            >
              <option value="casting">Casting</option>
              <option value="impact">Impact</option>
            </select>
          </label>
        </div>
        <div className="placeholder-container" ref={effectRef}></div>
      </div>
      
      <div className="info-text">
        <p>
          These placeholder assets are generated programmatically using HTML Canvas.
          In a production environment, these would be replaced with actual images and videos.
        </p>
        
        <p>
          To use these placeholders in your components:
        </p>
        
        <pre>
{`// For a discipline placeholder:
const canvas = AssetPlaceholder.createDisciplinePlaceholder('Fire');
const dataUrl = AssetPlaceholder.canvasToDataURL(canvas);
// Use the dataUrl as an image src:
<img src={dataUrl} alt="Fire discipline" />`}
        </pre>
      </div>
      
      <style jsx>{`
        .asset-demo {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        h2, h3 {
          color: #333;
        }
        
        .demo-section {
          margin-bottom: 30px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 14px;
          font-weight: bold;
        }
        
        select, input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          width: 150px;
        }
        
        .placeholder-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
        }
        
        .info-text {
          background: #e9f5ff;
          padding: 15px;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        pre {
          background: #333;
          color: #fff;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { SpellCastingEngine } from './SpellCastingEngine';
import { allSpells } from '../data/spells';
import { Spell, SpellCastResult } from '../types/spells';
import { SpellDiscipline } from '../types/gesture';

export const SpellCastingDemo: React.FC = () => {
  const [selectedSpells, setSelectedSpells] = useState<Spell[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<SpellDiscipline | null>(null);
  const [spellResults, setSpellResults] = useState<SpellCastResult[]>([]);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [showDebug, setShowDebug] = useState(true);
  
  // Initial setup - select a few spells for testing
  useEffect(() => {
    const initialSpells = [
      allSpells[0], // First attack spell (fireball)
      allSpells[6], // First defensive spell (stone shield)
      allSpells[10], // First status spell (shadow blindness)
    ];
    
    setSelectedSpells(initialSpells);
  }, []);
  
  // Handle spell cast events
  const handleSpellCast = (result: SpellCastResult) => {
    // Add to results history, keeping last 5
    setSpellResults(prev => [result, ...prev].slice(0, 5));
    
    // If spell was successful, simulate damage to opponent
    if (result.success && result.spell && result.effectivePower > 0) {
      if (result.spell.category === 'ATTACK') {
        // Apply damage to opponent
        setOpponentHealth(prev => Math.max(0, prev - Math.round(result.effectivePower)));
      } else if (result.spell.category === 'DEFENSE') {
        // Heal player a bit
        setPlayerHealth(prev => Math.min(100, prev + Math.round(result.effectivePower * 0.2)));
      }
    }
  };
  
  // Handle discipline detection
  const handleDisciplineDetected = (discipline: SpellDiscipline) => {
    setSelectedDiscipline(discipline);
    
    // Clear after 3 seconds
    setTimeout(() => {
      setSelectedDiscipline(null);
    }, 3000);
  };
  
  // Reset the demo
  const handleReset = () => {
    setPlayerHealth(100);
    setOpponentHealth(100);
    setSpellResults([]);
  };
  
  return (
    <div className="spell-casting-demo">
      <div className="game-header">
        <h2>Spell Casting Demo</h2>
        <p>
          Use the gestures from the gesture recognition test to cast spells. The game will recognize discipline gestures
          and spell sequences.
        </p>
        
        <div className="controls">
          <button onClick={handleReset}>Reset Demo</button>
          <label>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Show Debug Panel
          </label>
        </div>
      </div>
      
      <div className="game-view">
        <div className="health-bars">
          <div className="health-bar">
            <div className="label">Player Health</div>
            <div className="health-track">
              <div
                className="health-fill player"
                style={{ width: `${playerHealth}%` }}
              />
            </div>
            <div className="health-text">{playerHealth}/100</div>
          </div>
          
          <div className="health-bar">
            <div className="label">Opponent Health</div>
            <div className="health-track">
              <div
                className="health-fill opponent"
                style={{ width: `${opponentHealth}%` }}
              />
            </div>
            <div className="health-text">{opponentHealth}/100</div>
          </div>
        </div>
        
        {selectedDiscipline && (
          <div className="discipline-indicator">
            <p>Discipline Detected: {selectedDiscipline}</p>
          </div>
        )}
        
        <div className="spell-area">
          <SpellCastingEngine
            playerSpells={selectedSpells}
            onSpellCast={handleSpellCast}
            onDisciplineDetected={handleDisciplineDetected}
            debug={showDebug}
            environmentalFactors={{
              temperature: 0.7, // Hot environment makes fire spells stronger
              humidity: 0.5    // Medium humidity
            }}
          />
        </div>
        
        <div className="spell-results">
          <h3>Spell Cast Results</h3>
          {spellResults.length === 0 ? (
            <p>No spells cast yet. Try performing a gesture sequence!</p>
          ) : (
            <ul>
              {spellResults.map((result, index) => (
                <li key={index} className={result.success ? 'success' : 'failure'}>
                  {result.success ? (
                    <>
                      Cast <strong>{result.spell?.name}</strong> with {Math.round(result.accuracy * 100)}% accuracy
                      {result.isCritical && <span className="critical"> (CRITICAL!)</span>}
                      <br />
                      <span className="power">
                        Power: {Math.round(result.effectivePower)} damage
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Failed Cast:</strong> {result.failureReason}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="available-spells">
        <h3>Available Spells</h3>
        <div className="spell-list">
          {selectedSpells.map(spell => (
            <div key={spell.id} className={`spell-card ${spell.discipline.toLowerCase()}`}>
              <h4>{spell.name}</h4>
              <p>{spell.description}</p>
              <div className="spell-stats">
                <div>Discipline: {spell.discipline}</div>
                <div>Type: {spell.category}</div>
                <div>Power: {spell.basePower}</div>
                <div>Complexity: {spell.gestureComplexity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .spell-casting-demo {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .game-header {
          margin-bottom: 20px;
        }
        
        .controls {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 15px;
        }
        
        button {
          padding: 8px 16px;
          background: #4a6da7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        button:hover {
          background: #3a5d97;
        }
        
        .game-view {
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .health-bars {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .health-bar {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .label {
          font-weight: bold;
          font-size: 14px;
        }
        
        .health-track {
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .health-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .health-fill.player {
          background: linear-gradient(to right, #4caf50, #8bc34a);
        }
        
        .health-fill.opponent {
          background: linear-gradient(to right, #f44336, #ff9800);
        }
        
        .health-text {
          font-size: 12px;
          text-align: right;
        }
        
        .discipline-indicator {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          text-align: center;
          animation: fadeIn 0.3s;
        }
        
        .spell-area {
          min-height: 320px;
          background: #f5f5f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .spell-results {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .spell-results h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 18px;
        }
        
        .spell-results ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .spell-results li {
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        
        .spell-results li.success {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
        }
        
        .spell-results li.failure {
          background: #ffebee;
          border-left: 4px solid #f44336;
        }
        
        .critical {
          color: #e91e63;
          font-weight: bold;
        }
        
        .power {
          font-size: 14px;
          color: #555;
        }
        
        .available-spells h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .spell-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }
        
        .spell-card {
          background: white;
          border-radius: 6px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-top: 4px solid #ccc;
        }
        
        .spell-card h4 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        
        .spell-card p {
          font-size: 14px;
          color: #555;
          margin-bottom: 15px;
        }
        
        .spell-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          row-gap: 8px;
          font-size: 12px;
          color: #666;
        }
        
        .spell-card.fire { border-color: #f44336; }
        .spell-card.water { border-color: #2196f3; }
        .spell-card.earth { border-color: #795548; }
        .spell-card.air { border-color: #a6d4fa; }
        .spell-card.lightning { border-color: #673ab7; }
        .spell-card.shadow { border-color: #424242; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}; 
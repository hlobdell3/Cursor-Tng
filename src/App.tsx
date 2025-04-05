import React, { useState, useEffect } from 'react';
import SpellCasting from './components/SpellCasting';
import SpellTutorial from './components/SpellTutorial';
import { AssetDemo } from './components/AssetDemo';
import { AssetLoaderDemo } from './components/AssetLoaderDemo';
import { GestureDetectionDemo } from './components/GestureDetectionDemo';
import { SpellCastingDemo } from './components/SpellCastingDemo';
import { allSpells, attackSpells, defensiveSpells, statusSpells } from './data/spells';
import { SpellCastResult, Spell } from './types/spells';
import { SpellDiscipline } from './types/gesture';

enum GameState {
  MENU,
  TUTORIAL,
  SPELL_SELECTION,
  GAME_ACTIVE,
  GAME_OVER,
  ASSET_DEMO,
  ASSET_LOADER_DEMO,
  GESTURE_DEMO,
  SPELL_CASTING_DEMO
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedSpells, setSelectedSpells] = useState<Spell[]>([]);
  const [playerHealth, setPlayerHealth] = useState(500);
  const [opponentHealth, setOpponentHealth] = useState(500);
  const [lastCastSpell, setLastCastSpell] = useState<SpellCastResult | null>(null);
  const [currentDiscipline, setCurrentDiscipline] = useState<SpellDiscipline | null>(null);
  
  // Predefined spell selections for demo purposes
  const startingSpells = [
    attackSpells[0], // Fireball
    attackSpells[2], // Lightning Bolt
    defensiveSpells[0], // Stone Shield
    statusSpells[0], // Shadow Blindness
  ];
  
  useEffect(() => {
    // For demonstration, pre-select some spells
    setSelectedSpells(startingSpells);
  }, []);
  
  const handleGameStart = () => {
    setGameState(GameState.TUTORIAL);
  };
  
  const handleTutorialComplete = () => {
    setGameState(GameState.SPELL_SELECTION);
  };
  
  const handleTutorialSkip = () => {
    setGameState(GameState.SPELL_SELECTION);
  };
  
  const handleSpellSelectionComplete = (selectedSpells: Spell[]) => {
    setSelectedSpells(selectedSpells);
    setGameState(GameState.GAME_ACTIVE);
  };
  
  const handleSpellCast = (result: SpellCastResult) => {
    console.log('Spell cast:', result);
    setLastCastSpell(result);
    
    // For demonstration, simulate damaging opponent
    if (result.spell.category === 'ATTACK') {
      const damageAmount = Math.round(result.effectivePower);
      setOpponentHealth(prev => Math.max(0, prev - damageAmount));
      
      // Check for game over
      if (opponentHealth - damageAmount <= 0) {
        setTimeout(() => {
          setGameState(GameState.GAME_OVER);
        }, 2000);
      }
    }
  };
  
  const handleDisciplineDetected = (discipline: SpellDiscipline) => {
    setCurrentDiscipline(discipline);
    
    // Clear after a short delay
    setTimeout(() => {
      setCurrentDiscipline(null);
    }, 3000);
  };
  
  const renderGameScreen = () => {
    console.log('Current game state:', gameState); // Debug log
    
    switch (gameState) {
      case GameState.MENU:
        return (
          <div className="game-menu">
            <h1>Spell Casting Game</h1>
            <p>Cast spells using hand gestures to defeat your opponents!</p>
            <div className="menu-buttons">
              <button onClick={handleGameStart}>Start Game</button>
              <button onClick={() => setGameState(GameState.GESTURE_DEMO)}>
                Gesture Recognition Test
              </button>
              <button onClick={() => setGameState(GameState.SPELL_CASTING_DEMO)}>
                Spell Casting Demo
              </button>
              <button onClick={() => setGameState(GameState.ASSET_DEMO)}>
                View Asset Placeholders
              </button>
            </div>
          </div>
        );
      
      case GameState.TUTORIAL:
        return (
          <div className="tutorial">
            <SpellTutorial
              onComplete={handleTutorialComplete}
              onSkip={handleTutorialSkip}
            />
          </div>
        );
      
      case GameState.SPELL_SELECTION:
        return (
          <div className="spell-selection">
            <h2>Select Your Spells</h2>
            <div className="spell-grid">
              {allSpells.map(spell => (
                <div key={spell.id} className="spell-card">
                  <h3>{spell.name}</h3>
                  <p>{spell.description}</p>
                  <p>Power: {spell.power}</p>
                  <p>Category: {spell.category}</p>
                </div>
              ))}
            </div>
            <button onClick={() => handleSpellSelectionComplete(startingSpells)}>
              Continue with Default Spells
            </button>
          </div>
        );
      
      case GameState.GAME_ACTIVE:
        return (
          <div className="game-arena">
            <div className="health-bars">
              <div className="health-bar">
                <div className="health-label">Player Health</div>
                <div 
                  className="health-fill" 
                  style={{ width: `${(playerHealth / 500) * 100}%` }}
                />
              </div>
              <div className="health-bar">
                <div className="health-label">Opponent Health</div>
                <div 
                  className="health-fill" 
                  style={{ width: `${(opponentHealth / 500) * 100}%` }}
                />
              </div>
            </div>
            
            <SpellCasting
              onSpellCast={handleSpellCast}
              playerSpells={selectedSpells}
              playerHealth={playerHealth}
              gameActive={true}
              onDisciplineDetected={handleDisciplineDetected}
            />
            
            {lastCastSpell && (
              <div className="last-spell-cast">
                Last cast: {lastCastSpell.spell.name} (Power: {lastCastSpell.effectivePower})
              </div>
            )}
            
            {currentDiscipline && (
              <div className="current-discipline">
                Current Discipline: {currentDiscipline}
              </div>
            )}
          </div>
        );
      
      case GameState.GAME_OVER:
        return (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>{opponentHealth <= 0 ? 'You won!' : 'You lost!'}</p>
            <button onClick={() => setGameState(GameState.MENU)}>
              Return to Menu
            </button>
          </div>
        );
      
      case GameState.GESTURE_DEMO:
        return (
          <div className="gesture-demo-container">
            <button className="back-button" onClick={() => setGameState(GameState.MENU)}>
              Back to Menu
            </button>
            <GestureDetectionDemo />
          </div>
        );
      
      case GameState.SPELL_CASTING_DEMO:
        return (
          <div className="spell-casting-demo-container">
            <button className="back-button" onClick={() => setGameState(GameState.MENU)}>
              Back to Menu
            </button>
            <SpellCastingDemo />
          </div>
        );
      
      case GameState.ASSET_DEMO:
        return (
          <div className="asset-demo-container">
            <button className="back-button" onClick={() => setGameState(GameState.MENU)}>
              Back to Menu
            </button>
            <AssetDemo />
          </div>
        );
      
      default:
        return (
          <div className="game-menu">
            <h1>Error: Invalid Game State</h1>
            <button onClick={() => setGameState(GameState.MENU)}>
              Return to Menu
            </button>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {renderGameScreen()}
      <style>{`
        .app-container {
          max-width: 100vw;
          min-height: 100vh;
          padding: 20px;
          background: #f0f2f5;
        }
        
        .game-menu {
          text-align: center;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .game-menu h1 {
          color: #1a1a1a;
          margin-bottom: 20px;
          font-size: 2.5em;
        }
        
        .game-menu p {
          color: #666;
          margin-bottom: 30px;
          font-size: 1.2em;
        }
        
        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-width: 300px;
          margin: 0 auto;
        }
        
        .menu-buttons button {
          padding: 12px 24px;
          font-size: 1.1em;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .menu-buttons button:hover {
          background: #357abd;
        }
        
        .back-button {
          position: absolute;
          top: 20px;
          left: 20px;
          padding: 8px 16px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          z-index: 100;
        }
        
        .back-button:hover {
          background: #357abd;
        }
        
        .gesture-demo-container,
        .spell-casting-demo-container,
        .asset-demo-container {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default App; 
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
    switch (gameState) {
      case GameState.MENU:
        return (
          <div className="game-menu">
            <h1>Spell Casting Game</h1>
            <p>Cast spells using hand gestures to defeat your opponents!</p>
            <div className="menu-buttons">
              <button onClick={handleGameStart}>Start Game</button>
              <button onClick={() => setGameState(GameState.ASSET_DEMO)}>
                View Asset Placeholders
              </button>
              <button onClick={() => setGameState(GameState.ASSET_LOADER_DEMO)}>
                Asset Loader Demo
              </button>
              <button onClick={() => setGameState(GameState.GESTURE_DEMO)}>
                Gesture Recognition Test
              </button>
              <button onClick={() => setGameState(GameState.SPELL_CASTING_DEMO)}>
                Spell Casting Demo
              </button>
            </div>
          </div>
        );
        
      case GameState.TUTORIAL:
        return (
          <SpellTutorial 
            spells={startingSpells}
            onComplete={handleTutorialComplete}
            onExit={handleTutorialSkip}
          />
        );
        
      case GameState.SPELL_SELECTION:
        // In a real implementation, this would be a separate component
        return (
          <div className="spell-selection">
            <h2>Select Your Spells</h2>
            <p>Choose spells to take into battle. For this demo, we've pre-selected some for you.</p>
            <div className="selected-spells">
              {selectedSpells.map(spell => (
                <div key={spell.id} className="spell-card">
                  <h3>{spell.name}</h3>
                  <p>{spell.description}</p>
                  <p><strong>Discipline:</strong> {spell.discipline}</p>
                  <p><strong>Type:</strong> {spell.category}</p>
                </div>
              ))}
            </div>
            <button onClick={() => handleSpellSelectionComplete(selectedSpells)}>
              Start Battle
            </button>
          </div>
        );
        
      case GameState.GAME_ACTIVE:
        return (
          <div className="game-arena">
            <div className="health-bars">
              <div className="health-bar player">
                <div className="health-label">Player: {playerHealth}</div>
                <div className="health-fill" style={{ width: `${(playerHealth / 500) * 100}%` }} />
              </div>
              <div className="health-bar opponent">
                <div className="health-label">Opponent: {opponentHealth}</div>
                <div className="health-fill" style={{ width: `${(opponentHealth / 500) * 100}%` }} />
              </div>
            </div>
            
            {currentDiscipline && (
              <div className="opponent-casting">
                <h3>Opponent is casting a {currentDiscipline} spell!</h3>
              </div>
            )}
            
            {lastCastSpell && (
              <div className="last-spell-cast">
                <h3>You cast {lastCastSpell.spell.name}!</h3>
                <p>Power: {Math.round(lastCastSpell.effectivePower)}</p>
                <p>Accuracy: {Math.round(lastCastSpell.accuracy * 100)}%</p>
              </div>
            )}
            
            <SpellCasting 
              onSpellCast={handleSpellCast}
              playerSpells={selectedSpells}
              playerHealth={playerHealth}
              gameActive={true}
              onDisciplineDetected={handleDisciplineDetected}
            />
          </div>
        );
        
      case GameState.GAME_OVER:
        return (
          <div className="game-over">
            <h1>{opponentHealth <= 0 ? 'Victory!' : 'Defeat!'}</h1>
            <p>{opponentHealth <= 0 ? 'You defeated your opponent!' : 'Your opponent was victorious.'}</p>
            <button onClick={() => window.location.reload()}>Play Again</button>
          </div>
        );
        
      case GameState.ASSET_DEMO:
        return (
          <div className="asset-demo-container">
            <button onClick={() => setGameState(GameState.MENU)} className="back-button">
              Back to Menu
            </button>
            <AssetDemo showAll={true} />
          </div>
        );
        
      case GameState.ASSET_LOADER_DEMO:
        return (
          <div className="asset-demo-container">
            <button onClick={() => setGameState(GameState.MENU)} className="back-button">
              Back to Menu
            </button>
            <AssetLoaderDemo usePlaceholders={true} />
          </div>
        );
        
      case GameState.GESTURE_DEMO:
        return (
          <div className="gesture-demo-container">
            <button onClick={() => setGameState(GameState.MENU)} className="back-button">
              Back to Menu
            </button>
            <GestureDetectionDemo />
          </div>
        );
        
      case GameState.SPELL_CASTING_DEMO:
        return (
          <div className="spell-casting-demo-container">
            <button onClick={() => setGameState(GameState.MENU)} className="back-button">
              Back to Menu
            </button>
            <SpellCastingDemo />
          </div>
        );
    }
  };
  
  return (
    <div className="app-container">
      {renderGameScreen()}
      <style jsx>{`
        .app-container {
          max-width: 100vw;
          min-height: 100vh;
          padding: 20px;
          background: #f0f2f5;
        }
        
        .game-menu {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 300px;
          margin: 20px auto;
        }
        
        .game-menu button {
          margin: 0;
          padding: 12px 24px;
          font-size: 18px;
          background: #4a6da7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .game-menu button:hover {
          background: #3a5d97;
        }
        
        .back-button {
          margin-bottom: 20px;
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .back-button:hover {
          background: #5a6268;
        }
        
        .asset-demo-container, .gesture-demo-container, .spell-casting-demo-container {
          padding-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default App; 
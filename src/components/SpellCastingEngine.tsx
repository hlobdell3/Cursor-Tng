import React, { useEffect, useRef, useState } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { SpellManager } from '../utils/SpellManager';
import { AssetLoader } from '../utils/AssetLoader';
import { Gesture, GestureSequence, SpellDiscipline } from '../types/gesture';
import { Spell, SpellCastResult } from '../types/spells';

interface SpellCastingEngineProps {
  playerSpells: Spell[];
  playerSkill?: number; // Player skill level (0-1)
  onSpellCast: (result: SpellCastResult) => void;
  onDisciplineDetected?: (discipline: SpellDiscipline) => void;
  environmentalFactors?: { [key: string]: number };
  debug?: boolean;
}

export const SpellCastingEngine: React.FC<SpellCastingEngineProps> = ({
  playerSpells,
  playerSkill = 0.7,
  onSpellCast,
  onDisciplineDetected,
  environmentalFactors = {},
  debug = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gestureDetector, setGestureDetector] = useState<GestureDetector | null>(null);
  const [spellManager, setSpellManager] = useState<SpellManager | null>(null);
  const [assetLoader, setAssetLoader] = useState<AssetLoader | null>(null);
  
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [detectedGesture, setDetectedGesture] = useState<Gesture | null>(null);
  const [detectedSequence, setDetectedSequence] = useState<GestureSequence | null>(null);
  const [lastDetectedDiscipline, setLastDetectedDiscipline] = useState<SpellDiscipline | null>(null);
  
  const [spellCooldowns, setSpellCooldowns] = useState<{[key: string]: number}>({});
  const [fps, setFps] = useState(0);
  
  // Gesture mappings for each discipline
  const disciplineGestures: Gesture[] = [
    {
      id: 'fire_gesture',
      name: 'Fire Gesture',
      disciplineKey: SpellDiscipline.FIRE,
      fingerPositions: [0.8, 0.8, 0.8, 0.8, 0.8], // Open palm
      threshold: 0.6,
      description: 'Open palm with all fingers extended'
    },
    {
      id: 'water_gesture',
      name: 'Water Gesture',
      disciplineKey: SpellDiscipline.WATER,
      fingerPositions: [0.3, 0.9, 0.9, 0.2, 0.2], // Index and middle extended
      threshold: 0.6,
      description: 'V-sign with index and middle fingers'
    },
    {
      id: 'earth_gesture',
      name: 'Earth Gesture',
      disciplineKey: SpellDiscipline.EARTH,
      fingerPositions: [0.1, 0.1, 0.1, 0.1, 0.1], // Closed fist
      threshold: 0.6,
      description: 'Closed fist with all fingers curled in'
    },
    {
      id: 'air_gesture',
      name: 'Air Gesture',
      disciplineKey: SpellDiscipline.AIR,
      fingerPositions: [0.3, 0.9, 0.2, 0.2, 0.2], // Index finger extended
      threshold: 0.6,
      description: 'Point with index finger'
    },
    {
      id: 'lightning_gesture',
      name: 'Lightning Gesture',
      disciplineKey: SpellDiscipline.LIGHTNING,
      fingerPositions: [0.3, 0.9, 0.2, 0.2, 0.9], // Index and pinky extended
      threshold: 0.6,
      description: 'Index and pinky fingers extended'
    },
    {
      id: 'shadow_gesture',
      name: 'Shadow Gesture',
      disciplineKey: SpellDiscipline.SHADOW,
      fingerPositions: [0.3, 0.2, 0.2, 0.2, 0.9], // Thumb and pinky extended
      threshold: 0.6,
      description: 'Thumb and pinky fingers extended'
    }
  ];
  
  // Define spell gesture sequences based on discipline gestures
  const spellSequences: GestureSequence[] = playerSpells.map((spell, index) => {
    // Find the discipline gesture for this spell
    const disciplineGesture = disciplineGestures.find(
      g => g.disciplineKey === spell.discipline
    );
    
    if (!disciplineGesture) {
      console.error(`No gesture found for discipline: ${spell.discipline}`);
      return {
        id: `error_sequence_${index}`,
        name: `Error Sequence ${index}`,
        disciplineKey: SpellDiscipline.FIRE,
        gestures: [],
        description: 'Error sequence'
      };
    }
    
    // For simplicity, creating sequences with just the discipline gesture
    // In a real implementation, unique gestures would be defined for each spell
    // The complexity would be represented by the number of gestures in the sequence
    const complexity = spell.gestureComplexity || 1;
    const gestures: Gesture[] = [];
    
    // Add the discipline gesture (complexity) times
    for (let i = 0; i < complexity; i++) {
      gestures.push(disciplineGesture);
    }
    
    return {
      id: `spell_sequence_${spell.id}`,
      name: `${spell.name} Sequence`,
      disciplineKey: spell.discipline,
      gestures,
      description: `Gesture sequence for casting ${spell.name}`
    };
  });
  
  // Initialize the components when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the gesture detector
        const detector = new GestureDetector();
        const initialized = await detector.initialize();
        
        if (!initialized) {
          setError('Failed to initialize gesture detector. Please check browser compatibility.');
          return;
        }
        
        setGestureDetector(detector);
        
        // Initialize the spell manager
        const manager = SpellManager.getInstance();
        manager.registerSpells(playerSpells);
        setSpellManager(manager);
        
        // Initialize the asset loader
        const loader = AssetLoader.getInstance();
        loader.configure({ usePlaceholders: true }); // Use placeholders until real assets are available
        setAssetLoader(loader);
        
        // Preload spell assets
        await manager.preloadSpellAssets();
        
        setInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize spell casting engine. Please try again.');
      }
    };
    
    initialize();
    
    // Clean up on unmount
    return () => {
      if (gestureDetector) {
        gestureDetector.dispose();
      }
    };
  }, [playerSpells]);
  
  // Set up camera and gesture detection once initialized
  useEffect(() => {
    if (!initialized || !gestureDetector || !videoRef.current) return;
    
    const setupCamera = async () => {
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          },
          audio: false
        });
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setCameraActive(true);
              
              // Set up gesture detector with the video element
              gestureDetector.setVideoElement(videoRef.current);
              
              // Register gestures and sequences
              gestureDetector.registerGestures(disciplineGestures);
              gestureDetector.registerSequences(spellSequences);
              
              // Start detection
              gestureDetector.startDetection();
            }
          };
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Failed to access camera. Please check permissions and try again.');
      }
    };
    
    setupCamera();
    
    // Clean up
    return () => {
      if (gestureDetector) {
        gestureDetector.stopDetection();
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initialized, gestureDetector, disciplineGestures, spellSequences]);
  
  // Set up gesture detection callbacks
  useEffect(() => {
    if (!gestureDetector || !spellManager) return;
    
    // Handle gesture detection
    gestureDetector.onGestureDetected((gesture: Gesture) => {
      setDetectedGesture(gesture);
      
      // Trigger discipline detected callback
      if (onDisciplineDetected && gesture.disciplineKey) {
        setLastDetectedDiscipline(gesture.disciplineKey);
        onDisciplineDetected(gesture.disciplineKey);
      }
    });
    
    // Handle gesture sequence detection
    gestureDetector.onGestureSequenceDetected((sequence: GestureSequence) => {
      setDetectedSequence(sequence);
      
      // Attempt to cast a spell based on the detected sequence
      const now = Date.now();
      
      // Find the corresponding player spell
      const spellId = sequence.id.replace('spell_sequence_', '');
      const matchingSpell = playerSpells.find(spell => spell.id === spellId);
      
      // Check if spell is on cooldown
      if (matchingSpell && spellCooldowns[matchingSpell.id] && now < spellCooldowns[matchingSpell.id]) {
        console.log(`Spell ${matchingSpell.name} is on cooldown`);
        return;
      }
      
      // Cast the spell
      const castResult = spellManager.castSpell(
        sequence,
        playerSkill,
        environmentalFactors
      );
      
      // If successful, put the spell on cooldown
      if (castResult.success && castResult.spell) {
        setSpellCooldowns(prev => ({
          ...prev,
          [castResult.spell.id]: now + castResult.spell.cooldown
        }));
      }
      
      // Notify parent component
      onSpellCast(castResult);
    });
    
    // Update FPS counter
    const fpsInterval = setInterval(() => {
      if (gestureDetector) {
        setFps(Math.round(gestureDetector.getFps()));
      }
    }, 1000);
    
    return () => {
      clearInterval(fpsInterval);
    };
  }, [gestureDetector, spellManager, playerSkill, environmentalFactors, onSpellCast, onDisciplineDetected, playerSpells]);
  
  // Render loading state
  if (!initialized) {
    return (
      <div className="spell-casting-loading">
        <h3>Initializing Spell Casting Engine...</h3>
        <p>Please wait while we set up the magic...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="spell-casting-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div className="spell-casting-engine">
      {/* Hidden video element for gesture detection */}
      <video
        ref={videoRef}
        style={{ display: debug ? 'block' : 'none', transform: 'scaleX(-1)' }}
        width="320"
        height="240"
      />
      
      {/* Debug info */}
      {debug && (
        <div className="debug-panel">
          <h4>Debug Info</h4>
          <p>FPS: {fps}</p>
          <p>Camera: {cameraActive ? 'Active' : 'Inactive'}</p>
          <p>Last Discipline: {lastDetectedDiscipline || 'None'}</p>
          <p>Last Gesture: {detectedGesture?.name || 'None'}</p>
          <p>Last Sequence: {detectedSequence?.name || 'None'}</p>
          <div className="cooldowns">
            <h5>Cooldowns:</h5>
            <ul>
              {Object.entries(spellCooldowns).map(([spellId, cooldownTime]) => {
                const spell = playerSpells.find(s => s.id === spellId);
                const now = Date.now();
                const remaining = Math.max(0, cooldownTime - now);
                const isOnCooldown = remaining > 0;
                
                return (
                  <li key={spellId}>
                    {spell?.name}: {isOnCooldown ? `${Math.ceil(remaining / 1000)}s` : 'Ready'}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .spell-casting-engine {
          position: relative;
        }
        
        .spell-casting-loading,
        .spell-casting-error {
          padding: 20px;
          text-align: center;
          background: #f5f5f5;
          border-radius: 8px;
        }
        
        .spell-casting-error {
          color: #d32f2f;
          background: #ffebee;
        }
        
        .debug-panel {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          max-width: 300px;
        }
        
        .debug-panel h4, .debug-panel h5 {
          margin: 0 0 5px 0;
        }
        
        .debug-panel p {
          margin: 3px 0;
        }
        
        .cooldowns ul {
          margin: 5px 0;
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
}; 
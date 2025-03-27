import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognitionService } from '../services/GestureRecognitionService';
import { Spell } from '../types/spells';
import { GestureStep, SpellDiscipline } from '../types/gesture';

interface SpellTutorialProps {
  spells: Spell[];
  onComplete: () => void;
  onExit: () => void;
}

interface TutorialStep {
  type: 'INTRO' | 'SPELL_INTRO' | 'DEMONSTRATION' | 'PRACTICE' | 'FEEDBACK' | 'COMPLETE';
  spell?: Spell;
  practiceAttempt?: number;
  accuracy?: number;
}

const SpellTutorial: React.FC<SpellTutorialProps> = ({
  spells,
  onComplete,
  onExit
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demonstrationVideoRef = useRef<HTMLVideoElement>(null);
  const [gestureService] = useState<GestureRecognitionService>(() => new GestureRecognitionService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSpellIndex, setCurrentSpellIndex] = useState(0);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>({ type: 'INTRO' });
  const [practiceAttempts, setPracticeAttempts] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState(0);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [disciplineExplanations] = useState<Record<SpellDiscipline, string>>({
    FIRE: "Fire spells begin with a circular motion of your right hand. They deal high damage but have longer casting times.",
    WATER: "Water spells begin with a flowing wave motion of both hands. They provide moderate effects with good casting speed.",
    AIR: "Air spells begin with upward sweeping motions. They're quick to cast but have lower damage output.",
    EARTH: "Earth spells begin with firm downward gestures. They provide strong defensive capabilities.",
    LIGHTNING: "Lightning spells begin with a zigzag motion. They deal high damage with moderate casting times.",
    SHADOW: "Shadow spells begin with crossed arms. They cause disruptive status effects on opponents."
  });
  
  // Initialize the gesture recognition service on component mount
  useEffect(() => {
    const initializeGestureService = async () => {
      try {
        const success = await gestureService.initialize();
        if (success && videoRef.current) {
          setIsInitialized(true);
          gestureService.setupVideo(videoRef.current);
        }
      } catch (error) {
        console.error('Failed to initialize gesture service for tutorial:', error);
      }
    };
    
    initializeGestureService();
    
    return () => {
      if (isInitialized) {
        gestureService.stopTracking();
      }
    };
  }, [gestureService]);
  
  // Set up webcam
  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing webcam for tutorial:', error);
      }
    };
    
    if (tutorialStep.type === 'PRACTICE') {
      setupWebcam();
    }
    
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [tutorialStep.type]);
  
  // Handle tutorial progression
  const advanceTutorial = () => {
    const currentSpell = spells[currentSpellIndex];
    
    switch (tutorialStep.type) {
      case 'INTRO':
        setTutorialStep({ 
          type: 'SPELL_INTRO', 
          spell: currentSpell 
        });
        break;
        
      case 'SPELL_INTRO':
        setTutorialStep({ 
          type: 'DEMONSTRATION', 
          spell: currentSpell 
        });
        playDemonstrationVideo(currentSpell);
        break;
        
      case 'DEMONSTRATION':
        setPracticeAttempts(0);
        setBestAccuracy(0);
        setPracticeComplete(false);
        setTutorialStep({ 
          type: 'PRACTICE', 
          spell: currentSpell,
          practiceAttempt: 0
        });
        startPracticeSession(currentSpell);
        break;
        
      case 'PRACTICE':
        setTutorialStep({ 
          type: 'FEEDBACK', 
          spell: currentSpell,
          accuracy: bestAccuracy 
        });
        break;
        
      case 'FEEDBACK':
        // Move to the next spell or complete tutorial
        if (currentSpellIndex < spells.length - 1) {
          setCurrentSpellIndex(currentSpellIndex + 1);
          setTutorialStep({ 
            type: 'SPELL_INTRO', 
            spell: spells[currentSpellIndex + 1] 
          });
        } else {
          setTutorialStep({ type: 'COMPLETE' });
        }
        break;
        
      case 'COMPLETE':
        onComplete();
        break;
    }
  };
  
  // Play the demonstration video for a spell
  const playDemonstrationVideo = (spell: Spell) => {
    if (demonstrationVideoRef.current) {
      // In a real implementation, we would load the appropriate video for the spell
      // Here we're just setting the source based on the spell discipline
      demonstrationVideoRef.current.src = `assets/demonstrations/${spell.discipline.toLowerCase()}_${spell.name.toLowerCase().replace(/\s/g, '_')}.mp4`;
      demonstrationVideoRef.current.play().catch(err => {
        console.error('Error playing demonstration video:', err);
      });
    }
  };
  
  // Start a practice session for a spell
  const startPracticeSession = (spell: Spell) => {
    if (!isInitialized) {
      console.error('Gesture service not initialized for practice');
      return;
    }
    
    // Register the specific spell's gesture sequence
    const spellGesture = {
      steps: [...spell.gestureSequence.disciplineGesture, ...spell.gestureSequence.uniqueGesture],
      timingTolerance: 500, // Be more lenient in tutorial mode
      name: spell.name,
      description: spell.description
    };
    
    gestureService.registerSpellGestures([spellGesture]);
    
    // Register the discipline gesture
    const disciplineGesture = {
      discipline: spell.discipline,
      baseGesture: spell.gestureSequence.disciplineGesture,
      visualCue: `assets/disciplines/${spell.discipline.toLowerCase()}.gif`
    };
    
    gestureService.registerDisciplineGestures([disciplineGesture]);
    
    // Start tracking
    gestureService.startTracking();
    
    // Set up an interval to check for the gesture
    const checkInterval = setInterval(() => {
      // Check if discipline was recognized first
      const disciplineResult = gestureService.identifyDiscipline();
      if (disciplineResult?.recognizedDiscipline === spell.discipline) {
        console.log(`Discipline recognized: ${spell.discipline} with accuracy ${disciplineResult.accuracy}`);
      }
      
      // Check if the full spell gesture was recognized
      const gestureResult = gestureService.identifySpellGesture();
      if (gestureResult?.recognizedGesture?.name === spell.name) {
        const accuracy = gestureResult.accuracy;
        console.log(`Spell recognized: ${spell.name} with accuracy ${accuracy}`);
        
        // Update best accuracy
        if (accuracy > bestAccuracy) {
          setBestAccuracy(accuracy);
        }
        
        // Increment practice attempts
        setPracticeAttempts(prev => prev + 1);
        
        // Consider practice complete after a good attempt or multiple tries
        if (accuracy > 0.7 || practiceAttempts >= 2) {
          setPracticeComplete(true);
          clearInterval(checkInterval);
        }
        
        // Reset for next attempt
        gestureService.resetGestureHistory();
      }
    }, 100);
    
    // Clean up after practice session
    return () => {
      clearInterval(checkInterval);
      gestureService.stopTracking();
    };
  };
  
  // Render different content based on tutorial step
  const renderTutorialContent = () => {
    switch (tutorialStep.type) {
      case 'INTRO':
        return (
          <div className="tutorial-intro">
            <h2>Spell Casting Tutorial</h2>
            <p>Welcome to the spell casting tutorial. You'll learn how to cast spells using hand gestures.</p>
            <p>Each spell discipline has a unique starting gesture, followed by spell-specific movements.</p>
            <p>You'll learn {spells.length} spells in this tutorial.</p>
            <button onClick={advanceTutorial}>Begin Tutorial</button>
            <button onClick={onExit}>Skip Tutorial</button>
          </div>
        );
        
      case 'SPELL_INTRO':
        return (
          <div className="spell-intro">
            <h2>{tutorialStep.spell?.name}</h2>
            <div className="spell-details">
              <div className="spell-icon" style={{ backgroundColor: getDisciplineColor(tutorialStep.spell?.discipline) }}>
                {tutorialStep.spell?.name.charAt(0)}
              </div>
              <div className="spell-info">
                <p><strong>Discipline:</strong> {tutorialStep.spell?.discipline}</p>
                <p><strong>Category:</strong> {tutorialStep.spell?.category}</p>
                <p><strong>Description:</strong> {tutorialStep.spell?.description}</p>
                <p><strong>Complexity:</strong> {renderComplexityStars(tutorialStep.spell?.complexity || 1)}</p>
              </div>
            </div>
            <div className="discipline-explanation">
              <h3>{tutorialStep.spell?.discipline} Discipline</h3>
              <p>{disciplineExplanations[tutorialStep.spell?.discipline as SpellDiscipline]}</p>
            </div>
            <button onClick={advanceTutorial}>Show Demonstration</button>
          </div>
        );
        
      case 'DEMONSTRATION':
        return (
          <div className="spell-demonstration">
            <h2>Casting {tutorialStep.spell?.name}</h2>
            <div className="demonstration-video-container">
              <video 
                ref={demonstrationVideoRef}
                className="demonstration-video"
                controls
                loop
                width="640"
                height="480"
              />
            </div>
            <div className="gesture-steps">
              <div className="step">
                <h3>Step 1: Discipline Gesture</h3>
                <p>Start with the {tutorialStep.spell?.discipline} discipline gesture</p>
                {/* In a real implementation, show images or animations of the discipline gesture */}
              </div>
              <div className="step">
                <h3>Step 2: Unique Spell Gesture</h3>
                <p>Follow with the specific gesture for {tutorialStep.spell?.name}</p>
                {/* In a real implementation, show images or animations of the specific spell gesture */}
              </div>
            </div>
            <button onClick={advanceTutorial}>Practice This Spell</button>
          </div>
        );
        
      case 'PRACTICE':
        return (
          <div className="spell-practice">
            <h2>Practice: {tutorialStep.spell?.name}</h2>
            <div className="practice-container">
              <div className="webcam-feed-container">
                <video 
                  ref={videoRef}
                  className="webcam-feed"
                  width="640"
                  height="480"
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="gesture-overlay"
                  width="640"
                  height="480"
                />
              </div>
              <div className="practice-instructions">
                <p>Try to cast {tutorialStep.spell?.name} using the gestures shown in the demonstration.</p>
                <p>Current best accuracy: {Math.round(bestAccuracy * 100)}%</p>
                <p>Attempts: {practiceAttempts}</p>
                {practiceComplete && (
                  <div className="practice-complete">
                    <p>Great job! You've successfully practiced this spell.</p>
                    <button onClick={advanceTutorial}>Continue</button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={advanceTutorial} disabled={!practiceComplete}>
              {practiceComplete ? "See Results" : "Practicing..."}
            </button>
          </div>
        );
        
      case 'FEEDBACK':
        return (
          <div className="spell-feedback">
            <h2>Spell Practice Results</h2>
            <div className="feedback-container">
              <h3>{tutorialStep.spell?.name}</h3>
              <div className="accuracy-meter">
                <div className="accuracy-label">Accuracy</div>
                <div className="accuracy-bar">
                  <div 
                    className="accuracy-fill" 
                    style={{ 
                      width: `${Math.round((tutorialStep.accuracy || 0) * 100)}%`,
                      backgroundColor: getAccuracyColor(tutorialStep.accuracy || 0)
                    }}
                  />
                </div>
                <div className="accuracy-percentage">
                  {Math.round((tutorialStep.accuracy || 0) * 100)}%
                </div>
              </div>
              <div className="spell-power">
                <h4>Effective Spell Power</h4>
                <div className="power-value">
                  {Math.round(((tutorialStep.spell?.power || 0) * (tutorialStep.accuracy || 0)) * 10) / 10}
                  <span className="max-power">/{tutorialStep.spell?.power}</span>
                </div>
              </div>
              <div className="feedback-message">
                {getFeedbackMessage(tutorialStep.accuracy || 0)}
              </div>
            </div>
            <button onClick={advanceTutorial}>
              {currentSpellIndex < spells.length - 1 ? "Next Spell" : "Complete Tutorial"}
            </button>
          </div>
        );
        
      case 'COMPLETE':
        return (
          <div className="tutorial-complete">
            <h2>Tutorial Complete!</h2>
            <p>Congratulations! You've completed the spell casting tutorial.</p>
            <p>You've learned {spells.length} spells across different disciplines.</p>
            <p>Remember, the more accurately you perform the gestures, the more powerful your spells will be.</p>
            <button onClick={onComplete}>Start Game</button>
          </div>
        );
    }
  };
  
  // Helper functions
  const renderComplexityStars = (complexity: number) => {
    const maxStars = 5;
    const stars = [];
    
    for (let i = 0; i < maxStars; i++) {
      if (i < complexity) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star">☆</span>);
      }
    }
    
    return <div className="complexity-stars">{stars}</div>;
  };
  
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.8) return "#4CAF50"; // Green
    if (accuracy >= 0.6) return "#FFC107"; // Yellow
    if (accuracy >= 0.4) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };
  
  const getFeedbackMessage = (accuracy: number): string => {
    if (accuracy >= 0.9) return "Perfect! Your gesture execution is flawless!";
    if (accuracy >= 0.8) return "Excellent! Your spell will be highly effective.";
    if (accuracy >= 0.7) return "Good job! Your spell will be effective.";
    if (accuracy >= 0.5) return "Decent attempt. Practice to improve your accuracy.";
    if (accuracy >= 0.3) return "You're getting there. Focus on the correct hand positions.";
    return "Keep practicing. Watch the demonstration again to improve.";
  };
  
  const getDisciplineColor = (discipline?: SpellDiscipline): string => {
    switch (discipline) {
      case 'FIRE': return "#FF5722";
      case 'WATER': return "#2196F3";
      case 'AIR': return "#BBDEFB";
      case 'EARTH': return "#795548";
      case 'LIGHTNING': return "#673AB7";
      case 'SHADOW': return "#424242";
      default: return "#9E9E9E";
    }
  };
  
  return (
    <div className="spell-tutorial">
      {renderTutorialContent()}
    </div>
  );
};

export default SpellTutorial; 
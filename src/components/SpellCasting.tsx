import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognitionService } from '../services/GestureRecognitionService';
import { SpellCastResult, Spell } from '../types/spells';
import { GestureRecognitionResult, SpellDiscipline } from '../types/gesture';

interface SpellCastingProps {
  onSpellCast: (result: SpellCastResult) => void;
  playerSpells: Spell[];
  playerHealth: number;
  gameActive: boolean;
  onDisciplineDetected?: (discipline: SpellDiscipline) => void;
}

const SpellCasting: React.FC<SpellCastingProps> = ({
  onSpellCast,
  playerSpells,
  playerHealth,
  gameActive,
  onDisciplineDetected
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gestureService] = useState<GestureRecognitionService>(() => new GestureRecognitionService());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [currentDiscipline, setCurrentDiscipline] = useState<SpellDiscipline | null>(null);
  const [castingProgress, setCastingProgress] = useState<number>(0);
  const [lastRecognizedGesture, setLastRecognizedGesture] = useState<GestureRecognitionResult | null>(null);
  
  // Initialize the gesture recognition service
  useEffect(() => {
    const initializeGestureService = async () => {
      try {
        const success = await gestureService.initialize();
        if (success && videoRef.current) {
          setIsInitialized(true);
          gestureService.setupVideo(videoRef.current);
          
          // Map player spells to gesture sequences
          const spellGestures = playerSpells.map(spell => ({
            steps: [...spell.gestureSequence.disciplineGesture, ...spell.gestureSequence.uniqueGesture],
            timingTolerance: 300, // ms
            name: spell.name,
            description: spell.description
          }));
          
          // Register spell gestures
          gestureService.registerSpellGestures(spellGestures);
          
          // Register discipline gestures
          const disciplineGestures = Array.from(
            new Set(playerSpells.map(spell => spell.discipline))
          ).map(discipline => {
            // Find a spell from this discipline to get its base gesture
            const sampleSpell = playerSpells.find(spell => spell.discipline === discipline);
            return {
              discipline,
              baseGesture: sampleSpell?.gestureSequence.disciplineGesture || [],
              visualCue: `assets/disciplines/${discipline.toLowerCase()}.gif` // Path to visual asset
            };
          });
          
          gestureService.registerDisciplineGestures(disciplineGestures);
          
          // Start tracking
          await gestureService.startTracking();
        }
      } catch (error) {
        console.error('Failed to initialize gesture service:', error);
      }
    };
    
    if (gameActive && !isInitialized) {
      initializeGestureService();
    }
    
    return () => {
      if (isInitialized) {
        gestureService.stopTracking();
        setIsInitialized(false);
      }
    };
  }, [gameActive, gestureService, isInitialized, playerSpells]);
  
  // Continuously check for gestures
  useEffect(() => {
    if (!isInitialized || !gameActive) return;
    
    const gestureCheckInterval = setInterval(() => {
      // First, try to identify a discipline if we don't have one yet
      if (!currentDiscipline) {
        const disciplineResult = gestureService.identifyDiscipline();
        if (disciplineResult?.recognizedDiscipline) {
          setCurrentDiscipline(disciplineResult.recognizedDiscipline);
          if (onDisciplineDetected) {
            onDisciplineDetected(disciplineResult.recognizedDiscipline);
          }
          
          // Start the casting animation
          setIsCasting(true);
          setCastingProgress(0.25); // 25% progress after discipline is recognized
        }
      }
      
      // Check for a complete spell gesture
      const gestureResult = gestureService.identifySpellGesture();
      if (gestureResult?.recognizedGesture) {
        setLastRecognizedGesture(gestureResult);
        
        // Find the corresponding spell
        const matchedSpell = playerSpells.find(
          spell => spell.name === gestureResult.recognizedGesture?.name
        );
        
        if (matchedSpell) {
          // Calculate casting speed penalty based on health
          const healthPercentage = playerHealth / 500; // Assuming max health is 500
          const castingSpeedPenalty = 1 + (1 - healthPercentage) * 0.5; // Up to 50% slower at 0 health
          
          // Complete the casting animation quickly
          setCastingProgress(1);
          
          // Create the spell cast result
          const spellCastResult: SpellCastResult = {
            spell: matchedSpell,
            caster: 'player', // This would be the actual player ID in multiplayer
            accuracy: gestureResult.accuracy,
            effectivePower: matchedSpell.power * gestureResult.accuracy,
            timestamp: Date.now(),
            hit: true // Will be determined by the game logic
          };
          
          // Reset for next casting
          setTimeout(() => {
            onSpellCast(spellCastResult);
            setIsCasting(false);
            setCurrentDiscipline(null);
            setCastingProgress(0);
            gestureService.resetGestureHistory();
          }, 500); // Short delay for animation
        }
      } else if (isCasting && castingProgress < 0.75) {
        // Gradually increase casting progress while waiting for full spell recognition
        setCastingProgress(prev => Math.min(prev + 0.02, 0.75));
      }
    }, 100); // Check every 100ms
    
    return () => {
      clearInterval(gestureCheckInterval);
    };
  }, [
    isInitialized, 
    gameActive, 
    gestureService, 
    currentDiscipline, 
    isCasting, 
    castingProgress, 
    playerSpells, 
    playerHealth, 
    onSpellCast, 
    onDisciplineDetected
  ]);
  
  // Handle webcam setup
  useEffect(() => {
    if (!gameActive) return;
    
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
        console.error('Error accessing webcam:', error);
      }
    };
    
    setupWebcam();
    
    return () => {
      // Clean up video stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [gameActive]);
  
  // Draw hand tracking and gesture visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isInitialized) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const drawHandTracking = () => {
      if (!ctx || !videoRef.current) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Draw video
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current!.width,
        canvasRef.current!.height
      );
      
      // Draw spell casting visuals
      if (isCasting) {
        // Draw discipline-specific effects
        if (currentDiscipline) {
          drawDisciplineEffect(ctx, currentDiscipline, castingProgress);
        }
        
        // Draw casting progress bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
          20, 
          canvasRef.current!.height - 40, 
          canvasRef.current!.width - 40, 
          20
        );
        
        // Color based on discipline
        ctx.fillStyle = getDisciplineColor(currentDiscipline);
        ctx.fillRect(
          20, 
          canvasRef.current!.height - 40, 
          (canvasRef.current!.width - 40) * castingProgress, 
          20
        );
      }
      
      requestAnimationFrame(drawHandTracking);
    };
    
    drawHandTracking();
  }, [isInitialized, isCasting, castingProgress, currentDiscipline]);
  
  // Helper function to draw discipline-specific effects
  const drawDisciplineEffect = (
    ctx: CanvasRenderingContext2D, 
    discipline: SpellDiscipline | null, 
    progress: number
  ) => {
    if (!discipline) return;
    
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;
    
    ctx.globalAlpha = progress * 0.7;
    
    switch (discipline) {
      case 'FIRE':
        // Draw fire-like particles
        for (let i = 0; i < 20 * progress; i++) {
          const x = Math.random() * width;
          const y = height - Math.random() * height * progress;
          const size = 5 + Math.random() * 15;
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.6)');
          gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'WATER':
        // Draw water-like waves
        ctx.strokeStyle = 'rgba(50, 150, 255, 0.7)';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 5; i++) {
          const yOffset = height * 0.6 + i * 20;
          
          ctx.beginPath();
          ctx.moveTo(0, yOffset);
          
          for (let x = 0; x < width; x += 10) {
            const y = yOffset + Math.sin(x * 0.05 + Date.now() * 0.002) * 10;
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
        }
        break;
        
      case 'LIGHTNING':
        // Draw lightning bolts
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.9)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3 * progress; i++) {
          const startX = width * 0.5 + (Math.random() - 0.5) * 100;
          const startY = 0;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          
          let x = startX;
          let y = startY;
          
          while (y < height * 0.7) {
            x += (Math.random() - 0.5) * 30;
            y += 10 + Math.random() * 20;
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
          
          // Add glow
          ctx.shadowColor = 'rgba(100, 150, 255, 0.8)';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        break;
        
      default:
        // Generic effect for other disciplines
        ctx.fillStyle = getDisciplineColor(discipline);
        ctx.globalAlpha = 0.2 * progress;
        ctx.fillRect(0, 0, width, height);
        break;
    }
    
    ctx.globalAlpha = 1;
  };
  
  // Helper function to get color based on discipline
  const getDisciplineColor = (discipline: SpellDiscipline | null): string => {
    switch (discipline) {
      case 'FIRE': return 'rgba(255, 100, 50, 0.8)';
      case 'WATER': return 'rgba(50, 150, 255, 0.8)';
      case 'AIR': return 'rgba(200, 200, 255, 0.8)';
      case 'EARTH': return 'rgba(150, 100, 50, 0.8)';
      case 'LIGHTNING': return 'rgba(180, 180, 255, 0.8)';
      case 'SHADOW': return 'rgba(100, 50, 150, 0.8)';
      default: return 'rgba(200, 200, 200, 0.8)';
    }
  };
  
  return (
    <div className="spell-casting-container">
      {gameActive && (
        <>
          <div className="video-container">
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
          
          {currentDiscipline && (
            <div className="discipline-indicator">
              <span>Casting {currentDiscipline} spell</span>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ 
                    width: `${castingProgress * 100}%`,
                    backgroundColor: getDisciplineColor(currentDiscipline)
                  }} 
                />
              </div>
            </div>
          )}
          
          {lastRecognizedGesture?.recognizedGesture && (
            <div className="recognized-spell">
              <span>Spell: {lastRecognizedGesture.recognizedGesture.name}</span>
              <span>Accuracy: {Math.round(lastRecognizedGesture.accuracy * 100)}%</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpellCasting; 
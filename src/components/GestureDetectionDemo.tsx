import React, { useState, useEffect } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { GestureVisualizer } from './GestureVisualizer';
import { Gesture, SpellDiscipline } from '../types/gesture';

export const GestureDetectionDemo: React.FC = () => {
  const [detector, setDetector] = useState<GestureDetector | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [testGestures] = useState<Gesture[]>([
    {
      id: 'open_palm',
      name: 'Open Palm',
      disciplineKey: SpellDiscipline.FIRE,
      fingerPositions: [0.8, 0.8, 0.8, 0.8, 0.8], // All fingers extended
      threshold: 0.6,
      description: 'Open palm with all fingers extended'
    },
    {
      id: 'point',
      name: 'Pointing',
      disciplineKey: SpellDiscipline.AIR,
      fingerPositions: [0.3, 0.9, 0.2, 0.2, 0.2], // Index finger extended
      threshold: 0.6,
      description: 'Point with index finger'
    },
    {
      id: 'fist',
      name: 'Closed Fist',
      disciplineKey: SpellDiscipline.EARTH,
      fingerPositions: [0.1, 0.1, 0.1, 0.1, 0.1], // All fingers closed
      threshold: 0.6,
      description: 'Closed fist with all fingers curled in'
    },
    {
      id: 'v_sign',
      name: 'Victory Sign',
      disciplineKey: SpellDiscipline.WATER,
      fingerPositions: [0.3, 0.9, 0.9, 0.2, 0.2], // Index and middle extended
      threshold: 0.6,
      description: 'V-sign with index and middle fingers'
    },
    {
      id: 'rock_on',
      name: 'Rock On',
      disciplineKey: SpellDiscipline.LIGHTNING,
      fingerPositions: [0.3, 0.9, 0.2, 0.2, 0.9], // Index and pinky extended
      threshold: 0.6,
      description: 'Index and pinky fingers extended'
    }
  ]);
  
  // Initialize the detector when component mounts
  useEffect(() => {
    const initDetector = async () => {
      try {
        const newDetector = new GestureDetector();
        await newDetector.initialize();
        setDetector(newDetector);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize gesture detector:', error);
        setErrorMessage('Failed to initialize gesture recognition. Please check browser compatibility and permissions.');
      }
    };
    
    initDetector();
    
    // Clean up when component unmounts
    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);
  
  return (
    <div className="gesture-detection-demo">
      <h2>Gesture Recognition Test</h2>
      
      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
          <p>Make sure your browser supports WebGL and camera access is allowed.</p>
        </div>
      )}
      
      {!initialized && !errorMessage && (
        <div className="loading">
          <p>Initializing gesture recognition system...</p>
          <p>This may take a few moments to load models...</p>
        </div>
      )}
      
      {initialized && detector && (
        <div className="demo-content">
          <GestureVisualizer detector={detector} gestures={testGestures} />
          
          <div className="gesture-guide">
            <h3>Try these gestures:</h3>
            <div className="gesture-list">
              {testGestures.map(gesture => (
                <div className="gesture-card" key={gesture.id}>
                  <h4>{gesture.name}</h4>
                  <p>{gesture.description}</p>
                  <p className="discipline">
                    <strong>Discipline:</strong> {gesture.disciplineKey}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .gesture-detection-demo {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        
        .loading, .error-message {
          text-align: center;
          padding: 40px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .error-message {
          background: #fff0f0;
          border-left: 4px solid #ff3b30;
          color: #d92626;
        }
        
        .demo-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .gesture-guide {
          background: #f0f7ff;
          padding: 20px;
          border-radius: 8px;
        }
        
        .gesture-guide h3 {
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .gesture-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
        }
        
        .gesture-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .gesture-card h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        
        .gesture-card p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .discipline {
          font-size: 12px;
          color: #666;
          margin-top: 10px !important;
        }
        
        @media (min-width: 768px) {
          .demo-content {
            flex-direction: row;
            align-items: flex-start;
          }
          
          .gesture-guide {
            flex: 1;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
}; 
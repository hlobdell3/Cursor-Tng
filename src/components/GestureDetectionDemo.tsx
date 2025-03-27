import React, { useState, useEffect } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { GestureVisualizer } from './GestureVisualizer';
import { Gesture, SpellDiscipline, MotionPattern } from '../types/gesture';
import GestureGuide from './GestureGuide';

export const GestureDetectionDemo: React.FC = () => {
  const [detector, setDetector] = useState<GestureDetector | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showIdealPositions, setShowIdealPositions] = useState<boolean>(false);
  const [testGestures] = useState<Gesture[]>([
    {
      id: 'circle_clockwise',
      name: 'Circular Motion (clockwise)',
      disciplineKey: SpellDiscipline.FIRE,
      fingerPositions: [0.8, 0.8, 0.8, 0.8, 0.8], // All fingers extended - basic open palm
      threshold: 0.5,
      description: 'Draw a clockwise circle with your hand',
      motionPattern: MotionPattern.CIRCLE_CLOCKWISE,
      handRequired: 'right'
    },
    {
      id: 'vertical_motion',
      name: 'Vertical Motion',
      disciplineKey: SpellDiscipline.AIR,
      fingerPositions: [0.3, 0.9, 0.2, 0.2, 0.2], // Index finger extended - for visual reference
      threshold: 0.5,
      description: 'Move your hand up and down vertically',
      motionPattern: MotionPattern.VERTICAL_UP_DOWN,
      handRequired: 'any'
    },
    {
      id: 'horizontal_motion',
      name: 'Horizontal Motion',
      disciplineKey: SpellDiscipline.EARTH,
      fingerPositions: [0.1, 0.1, 0.1, 0.1, 0.1], // Closed fist - for visual reference
      threshold: 0.5,
      description: 'Move your hand side to side horizontally',
      motionPattern: MotionPattern.HORIZONTAL_LEFT_RIGHT,
      handRequired: 'any'
    },
    {
      id: 'wave_motion',
      name: 'Wave Motion',
      disciplineKey: SpellDiscipline.WATER,
      fingerPositions: [0.3, 0.9, 0.9, 0.2, 0.2], // V-sign - for visual reference
      threshold: 0.5,
      description: 'Wave your hand side to side several times',
      motionPattern: MotionPattern.WAVE,
      handRequired: 'any'
    },
    {
      id: 'forward_thrust',
      name: 'Forward Thrust',
      disciplineKey: SpellDiscipline.LIGHTNING,
      fingerPositions: [0.2, 0.9, 0.2, 0.2, 0.9], // Rock on - for visual reference
      threshold: 0.65,
      description: 'Push your hand forward toward the camera',
      motionPattern: MotionPattern.FORWARD_THRUST,
      handRequired: 'any'
    }
  ]);
  
  // Initialize the detector when component mounts
  useEffect(() => {
    const initDetector = async () => {
      try {
        const newDetector = new GestureDetector();
        await newDetector.initialize(true); // Enable motion tracking
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
          <div className="main-content">
            <GestureVisualizer detector={detector} gestures={testGestures} />
            
            <div className="action-buttons">
              <button 
                className="toggle-guide-button"
                onClick={() => setShowIdealPositions(!showIdealPositions)}
              >
                {showIdealPositions ? 'Hide Ideal Positions' : 'Show Ideal Positions'}
              </button>
            </div>
            
            {showIdealPositions && <GestureGuide />}
          
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
        
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .action-buttons {
          display: flex;
          justify-content: center;
          margin: 10px 0;
        }
        
        .toggle-guide-button {
          background: #4a90e2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .toggle-guide-button:hover {
          background: #3a80d2;
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
          
          .main-content {
            flex: 1;
            max-width: 100%;
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
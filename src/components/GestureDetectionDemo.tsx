import React, { useState, useEffect, useRef } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { GestureVisualizer } from './GestureVisualizer';
import { Gesture, SpellDiscipline, MotionPattern, HandPose } from '../types/gesture';
import GestureGuide from './GestureGuide';
import { TensorFlowUtils } from '../utils/TensorFlowUtils';

export const GestureDetectionDemo: React.FC = () => {
  const [detector, setDetector] = useState<GestureDetector | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showIdealPositions, setShowIdealPositions] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [initializationStep, setInitializationStep] = useState<string>('Starting initialization...');
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const [testGestures] = useState<Gesture[]>([
    {
      id: 'fire_gesture',
      name: 'Fire',
      disciplineKey: SpellDiscipline.FIRE,
      description: 'Make a clockwise circular motion with your hand',
      motionPattern: MotionPattern.CIRCLE_CLOCKWISE,
      handRequired: 'any',
      motionDuration: 1000,
      threshold: 0.6,
      fingerPositions: [0.5, 0.5, 0.5, 0.5, 0.5] // Default values, not used
    },
    {
      id: 'air_gesture',
      name: 'Air',
      disciplineKey: SpellDiscipline.AIR,
      description: 'Clap your hands together',
      motionPattern: MotionPattern.TWO_HAND_CLAP,
      handRequired: 'any',
      motionDuration: 500,
      threshold: 0.6,
      fingerPositions: [0.5, 0.5, 0.5, 0.5, 0.5] // Default values, not used
    },
    {
      id: 'earth_gesture',
      name: 'Earth',
      disciplineKey: SpellDiscipline.EARTH,
      description: 'Create a V shape with both hands',
      motionPattern: MotionPattern.V_SHAPE,
      handRequired: 'any',
      motionDuration: 1000,
      threshold: 0.6,
      fingerPositions: [0.5, 0.5, 0.5, 0.5, 0.5] // Default values, not used
    },
    {
      id: 'water_gesture',
      name: 'Water',
      disciplineKey: SpellDiscipline.WATER,
      description: 'Draw a W shape with your hand',
      motionPattern: MotionPattern.W_SHAPE,
      handRequired: 'any',
      motionDuration: 1000,
      threshold: 0.6,
      fingerPositions: [0.5, 0.5, 0.5, 0.5, 0.5] // Default values, not used
    },
    {
      id: 'lightning_gesture',
      name: 'Lightning',
      disciplineKey: SpellDiscipline.LIGHTNING,
      description: 'Draw a Z shape with your hand',
      motionPattern: MotionPattern.ZIGZAG,
      handRequired: 'any',
      motionDuration: 1000,
      threshold: 0.6,
      fingerPositions: [0.5, 0.5, 0.5, 0.5, 0.5] // Default values, not used
    }
  ]);
  
  // Cleanup on unmount
  useEffect(() => {
    console.log('GestureDetectionDemo mounting...');
    isMounted.current = true;
    
    return () => {
      console.log('GestureDetectionDemo unmounting...');
      isMounted.current = false;
      if (detector) {
        detector.stopDetection();
        detector.dispose();
      }
    };
  }, [detector]);

  // Initialize the detector
  useEffect(() => {
    const setupDetector = async () => {
      if (isInitializing.current) {
        console.log('Detector initialization already in progress...');
        return;
      }

      try {
        isInitializing.current = true;
        setInitializationStep('Checking system requirements...');
        console.log('Checking system requirements...');
        
        // Check system requirements first
        const { supported, issues } = await TensorFlowUtils.checkSystemRequirements();
        if (!supported) {
          throw new Error(`System requirements not met: ${issues.join(', ')}`);
        }
        
        setInitializationStep('Initializing gesture detector...');
        console.log('Initializing gesture detector...');
        
        const newDetector = new GestureDetector();
        
        // Initialize with motion tracking enabled
        setInitializationStep('Setting up TensorFlow...');
        console.log('Setting up TensorFlow...');
        const success = await newDetector.initialize(true);
        if (!success) {
          throw new Error('Failed to initialize gesture detector');
        }
        
        if (!isMounted.current) {
          console.log('Component unmounted during detector initialization, cleaning up...');
          newDetector.dispose();
          return;
        }
        
        console.log('Gesture detector initialized successfully');
        setDetector(newDetector);
        
        // Register test gestures
        setInitializationStep('Registering gestures...');
        console.log('Registering gestures:', testGestures);
        newDetector.registerGestures(testGestures);
        
        // Set up callbacks
        setInitializationStep('Setting up callbacks...');
        console.log('Setting up callbacks...');
        newDetector.onHandPoseDetected((handPose) => {
          console.log('Hand pose detected:', {
            timestamp: handPose.timestamp,
            handedness: handPose.handedness,
            score: handPose.score,
            landmarks: handPose.landmarks.length
          });
        });
        
        newDetector.onGestureDetected((gesture) => {
          console.log('Gesture detected:', {
            name: gesture.name,
            discipline: gesture.disciplineKey,
            score: gesture.score,
            motionPattern: gesture.motionPattern
          });
        });
        
        setInitialized(true);
      } catch (error) {
        console.error('Error setting up gesture detector:', error);
        if (isMounted.current) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize gesture detection');
        }
      } finally {
        isInitializing.current = false;
      }
    };
    
    setupDetector();
  }, []);
  
  // Handle video element setup and detection start
  const handleVideoReady = async (videoElement: HTMLVideoElement) => {
    if (!detector) {
      console.error('Detector not initialized when video is ready');
      return;
    }

    try {
      setInitializationStep('Setting up video element...');
      console.log('Setting video element for detector...');
      
      // Ensure video element is ready
      if (!videoElement || !videoElement.readyState || videoElement.readyState < 2) {
        throw new Error('Video element is not ready');
      }
      
      detector.setVideoElement(videoElement);

      // Start detection
      setInitializationStep('Starting gesture detection...');
      console.log('Starting gesture detection...');
      const detectionStarted = await detector.startDetection();
      if (!detectionStarted) {
        throw new Error('Failed to start gesture detection');
      }

      console.log('Gesture detection started successfully');
      setInitialized(true);
    } catch (error) {
      console.error('Error setting up video and detection:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start gesture detection');
    }
  };

  // Define ideal hand positions for each gesture
  const idealPositions: Record<string, HandPose> = {
    fire: {
      timestamp: Date.now(),
      landmarks: [
        // Thumb
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.5, z: 0 },
        { x: 0.7, y: 0.5, z: 0 },
        { x: 0.8, y: 0.5, z: 0 },
        // Index
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.7, y: 0.3, z: 0 },
        { x: 0.8, y: 0.2, z: 0 },
        // Middle
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.3, z: 0 },
        { x: 0.7, y: 0.2, z: 0 },
        { x: 0.8, y: 0.1, z: 0 },
        // Ring
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.2, z: 0 },
        { x: 0.7, y: 0.1, z: 0 },
        { x: 0.8, y: 0.0, z: 0 },
        // Pinky
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.1, z: 0 },
        { x: 0.7, y: 0.0, z: 0 },
        { x: 0.8, y: -0.1, z: 0 },
        // Palm
        { x: 0.5, y: 0.5, z: 0 }
      ],
      handedness: 'right',
      score: 1.0
    },
    air: {
      timestamp: Date.now(),
      landmarks: [
        // Thumb
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.5, z: 0 },
        { x: 0.7, y: 0.5, z: 0 },
        { x: 0.8, y: 0.5, z: 0 },
        // Index
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.7, y: 0.3, z: 0 },
        { x: 0.8, y: 0.2, z: 0 },
        // Middle
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.3, z: 0 },
        { x: 0.7, y: 0.2, z: 0 },
        { x: 0.8, y: 0.1, z: 0 },
        // Ring
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.2, z: 0 },
        { x: 0.7, y: 0.1, z: 0 },
        { x: 0.8, y: 0.0, z: 0 },
        // Pinky
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.1, z: 0 },
        { x: 0.7, y: 0.0, z: 0 },
        { x: 0.8, y: -0.1, z: 0 },
        // Palm
        { x: 0.5, y: 0.5, z: 0 }
      ],
      handedness: 'right',
      score: 1.0
    },
    earth: {
      timestamp: Date.now(),
      landmarks: [
        // Thumb
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.5, z: 0 },
        { x: 0.7, y: 0.5, z: 0 },
        { x: 0.8, y: 0.5, z: 0 },
        // Index
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.7, y: 0.3, z: 0 },
        { x: 0.8, y: 0.2, z: 0 },
        // Middle
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.3, z: 0 },
        { x: 0.7, y: 0.2, z: 0 },
        { x: 0.8, y: 0.1, z: 0 },
        // Ring
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.2, z: 0 },
        { x: 0.7, y: 0.1, z: 0 },
        { x: 0.8, y: 0.0, z: 0 },
        // Pinky
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.1, z: 0 },
        { x: 0.7, y: 0.0, z: 0 },
        { x: 0.8, y: -0.1, z: 0 },
        // Palm
        { x: 0.5, y: 0.5, z: 0 }
      ],
      handedness: 'right',
      score: 1.0
    },
    water: {
      timestamp: Date.now(),
      landmarks: [
        // Thumb
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.5, z: 0 },
        { x: 0.7, y: 0.5, z: 0 },
        { x: 0.8, y: 0.5, z: 0 },
        // Index
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.7, y: 0.3, z: 0 },
        { x: 0.8, y: 0.2, z: 0 },
        // Middle
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.3, z: 0 },
        { x: 0.7, y: 0.2, z: 0 },
        { x: 0.8, y: 0.1, z: 0 },
        // Ring
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.2, z: 0 },
        { x: 0.7, y: 0.1, z: 0 },
        { x: 0.8, y: 0.0, z: 0 },
        // Pinky
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.1, z: 0 },
        { x: 0.7, y: 0.0, z: 0 },
        { x: 0.8, y: -0.1, z: 0 },
        // Palm
        { x: 0.5, y: 0.5, z: 0 }
      ],
      handedness: 'right',
      score: 1.0
    },
    lightning: {
      timestamp: Date.now(),
      landmarks: [
        // Thumb
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.5, z: 0 },
        { x: 0.7, y: 0.5, z: 0 },
        { x: 0.8, y: 0.5, z: 0 },
        // Index
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.7, y: 0.3, z: 0 },
        { x: 0.8, y: 0.2, z: 0 },
        // Middle
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.3, z: 0 },
        { x: 0.7, y: 0.2, z: 0 },
        { x: 0.8, y: 0.1, z: 0 },
        // Ring
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.2, z: 0 },
        { x: 0.7, y: 0.1, z: 0 },
        { x: 0.8, y: 0.0, z: 0 },
        // Pinky
        { x: 0.5, y: 0.5, z: 0 },
        { x: 0.6, y: 0.1, z: 0 },
        { x: 0.7, y: 0.0, z: 0 },
        { x: 0.8, y: -0.1, z: 0 },
        // Palm
        { x: 0.5, y: 0.5, z: 0 }
      ],
      handedness: 'right',
      score: 1.0
    }
  };

  if (errorMessage) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '8px',
        margin: '20px',
        maxWidth: '600px'
      }}>
        <h2>Error Initializing Gesture Detection</h2>
        <p>{errorMessage}</p>
        <p>Please try the following:</p>
        <ul>
          <li>Make sure your camera is properly connected and accessible</li>
          <li>Check if another application is using your camera</li>
          <li>Try refreshing the page</li>
          <li>Check your browser's console (F12) for more details</li>
        </ul>
        <button 
          onClick={() => {
            setErrorMessage('');
            setInitialized(false);
            isInitializing.current = false;
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Gesture Recognition Test</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setShowIdealPositions(!showIdealPositions)}>
          {showIdealPositions ? 'Hide' : 'Show'} Ideal Positions
        </button>
        <button onClick={() => setShowGuide(true)}>
          Show Gesture Guide
        </button>
        </div>
      {detector && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <GestureVisualizer
            detector={detector}
            showStats={true}
            gestures={testGestures}
            onVideoReady={handleVideoReady}
            style={{ width: '100%', maxWidth: '640px' }}
          />
        </div>
      )}
      {!initialized && (
        <div style={{ 
          padding: '20px', 
          background: '#f5f5f5', 
          marginTop: '20px', 
          borderRadius: '5px', 
          width: '100%', 
          maxWidth: '640px',
          textAlign: 'center'
        }}>
          <h3>Initializing Gesture Detection...</h3>
          <p>{initializationStep}</p>
          <p>Please wait while we set up the camera and gesture recognition system.</p>
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              background: '#ddd', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: '#4a90e2',
                animation: 'loading 1s infinite linear'
              }} />
            </div>
          </div>
        </div>
      )}
      {showGuide && <GestureGuide onClose={() => setShowGuide(false)} />}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}; 
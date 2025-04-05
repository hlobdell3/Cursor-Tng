import React, { useRef, useEffect, useState } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { HandPose, Gesture, SpellDiscipline } from '../types/gesture';
import * as tf from '@tensorflow/tfjs';

// Hand landmark connection lines for visualization
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17], [2, 5], [5, 9], [9, 13], [13, 17], // Palm
];

// Canvas dimensions
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

interface GestureVisualizerProps {
  detector?: GestureDetector;
  showStats?: boolean;
  gestures?: Gesture[];
  onVideoReady?: (videoElement: HTMLVideoElement) => void;
  style?: React.CSSProperties;
}

export const GestureVisualizer: React.FC<GestureVisualizerProps> = ({
  detector,
  showStats = true,
  gestures = [],
  onVideoReady,
  style
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMounted = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [handedness, setHandedness] = useState<string>('');
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [detectedDiscipline, setDetectedDiscipline] = useState<string>('');
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [handPose, setHandPose] = useState<HandPose | null>(null);
  const [lastGesture, setLastGesture] = useState<Gesture | null>(null);
  const [gestureStats, setGestureStats] = useState<{
    total: number;
    correct: number;
    incorrect: number;
  }>({ total: 0, correct: 0, incorrect: 0 });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initializationStep, setInitializationStep] = useState<string>('Initializing...');
  
  // Add visual effect state variables
  const [fireEffect, setFireEffect] = useState<boolean>(false);
  const [airEffect, setAirEffect] = useState<boolean>(false);
  const [earthEffect, setEarthEffect] = useState<boolean>(false);
  const [waterEffect, setWaterEffect] = useState<boolean>(false);
  const [lightningEffect, setLightningEffect] = useState<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize TensorFlow and camera
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        // Initialize TensorFlow.js
        setInitializationStep('Initializing TensorFlow.js...');
        console.log('Initializing TensorFlow.js...');
        await tf.ready();
        console.log('TensorFlow.js initialized successfully');

        // Set up camera
        if (!videoRef.current) {
          throw new Error('Video element not found');
        }

        setInitializationStep('Requesting camera access...');
        console.log('Requesting camera access...');
        
        // First try to get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices);

        // Request camera with specific constraints
        const constraints = {
          video: {
            width: { ideal: CANVAS_WIDTH },
            height: { ideal: CANVAS_HEIGHT },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          }
        };

        console.log('Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!stream) {
          throw new Error('Failed to get camera stream');
        }

        console.log('Camera stream obtained successfully');
        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        setInitializationStep('Waiting for video to be ready...');
        console.log('Waiting for video to be ready...');
        
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'));
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for video to be ready'));
          }, 30000); // Increased timeout to 30 seconds

          const checkVideoState = () => {
            if (videoRef.current?.readyState >= 2) {
              console.log('Video ready state:', videoRef.current.readyState);
              clearTimeout(timeout);
              resolve(null);
            } else {
              console.log('Video not ready yet, current state:', videoRef.current?.readyState);
              // Try again in 100ms
              setTimeout(checkVideoState, 100);
            }
          };

          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            checkVideoState();
          };

          videoRef.current.onerror = (error) => {
            console.error('Video error:', error);
            clearTimeout(timeout);
            reject(new Error(`Video error: ${error.message}`));
          };

          // Start checking video state immediately
          checkVideoState();
        });

        // Start playing the video
        setInitializationStep('Starting video playback...');
        console.log('Starting video playback...');
        
        try {
          await videoRef.current.play();
          console.log('Video playback started successfully');
        } catch (playError) {
          console.error('Error starting video playback:', playError);
          // Try to play with user interaction
          videoRef.current.play().catch(error => {
            console.error('Failed to start video playback:', error);
            throw new Error('Failed to start video playback. Please ensure camera permissions are granted.');
          });
        }
        setCameraReady(true);

        // Initialize detector if provided
        if (detector) {
          setInitializationStep('Initializing gesture detector...');
          console.log('Initializing gesture detector...');
          const initialized = await detector.initialize();
          if (initialized) {
            console.log('Gesture detector initialized successfully');
            setIsInitialized(true);
            detector.setVideoElement(videoRef.current);
            
            // Start detection
            console.log('Starting gesture detection...');
            const detectionStarted = await detector.startDetection();
            if (!detectionStarted) {
              throw new Error('Failed to start gesture detection');
            }
            console.log('Gesture detection started successfully');
          } else {
            throw new Error('Failed to initialize gesture detector');
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize: Unknown error');
        }
      }
    };

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      if (streamRef.current) {
        console.log('Cleaning up camera stream...');
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      if (detector) {
        console.log('Cleaning up gesture detector...');
        detector.stopDetection();
      }
    };
  }, [detector]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        console.log('Component unmounting, cleaning up camera stream...');
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      if (detector) {
        console.log('Component unmounting, cleaning up gesture detector...');
        detector.stopDetection();
      }
    };
  }, [detector]);

  // Handle gesture detection
  useEffect(() => {
    if (!detector) return;

    const handleGestureDetected = (gesture: Gesture) => {
      console.log('Gesture detected:', {
        name: gesture.name,
        discipline: gesture.disciplineKey,
        motionPattern: gesture.motionPattern
      });

      // Update visual effects based on detected gesture
      switch (gesture.disciplineKey) {
        case SpellDiscipline.FIRE:
          setFireEffect(true);
          setTimeout(() => setFireEffect(false), 2000);
          break;
        case SpellDiscipline.AIR:
          setAirEffect(true);
          setTimeout(() => setAirEffect(false), 2000);
          break;
        case SpellDiscipline.EARTH:
          setEarthEffect(true);
          setTimeout(() => setEarthEffect(false), 2000);
          break;
        case SpellDiscipline.WATER:
          setWaterEffect(true);
          setTimeout(() => setWaterEffect(false), 2000);
          break;
        case SpellDiscipline.LIGHTNING:
          setLightningEffect(true);
          setTimeout(() => setLightningEffect(false), 2000);
          break;
      }
    };

    const handleHandPoseDetected = (handPose: HandPose) => {
      console.log('Hand pose detected:', {
        timestamp: handPose.timestamp,
        handedness: handPose.handedness,
        score: handPose.score,
        landmarks: handPose.landmarks.length
      });
    };

    // Set up callbacks
    detector.onGestureDetected(handleGestureDetected);
    detector.onHandPoseDetected(handleHandPoseDetected);

    // Clean up callbacks on unmount
    return () => {
      detector.onGestureDetected(() => {});
      detector.onHandPoseDetected(() => {});
    };
  }, [detector]);

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
      setIsInitialized(true);
    } catch (error) {
      console.error('Error setting up video and detection:', error);
      setError(error instanceof Error ? error.message : 'Failed to start gesture detection');
    }
  };

  // Draw hand pose on canvas
  const drawHandPose = (handPose: HandPose) => {
    if (!canvasRef.current || !handPose.landmarks) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw connections
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = handPose.landmarks[start];
      const endPoint = handPose.landmarks[end];

      if (startPoint && endPoint) {
        ctx.moveTo(startPoint.x * CANVAS_WIDTH, startPoint.y * CANVAS_HEIGHT);
        ctx.lineTo(endPoint.x * CANVAS_WIDTH, endPoint.y * CANVAS_HEIGHT);
      }
    });

    ctx.stroke();
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <video
        ref={videoRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          objectFit: 'cover',
          zIndex: 1,
          display: isInitialized ? 'block' : 'none'
        }}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        autoPlay
        playsInline
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          border: '1px solid #ccc',
          display: isInitialized ? 'block' : 'none'
        }}
      />
      
      {/* Visual Effects */}
      {isInitialized && (
        <>
          {fireEffect && (
            <div className="fire-effect" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, rgba(255,0,0,0.1) 50%, transparent 100%)',
              animation: 'fadeOut 2s forwards',
              zIndex: 3
            }} />
          )}
          
          {airEffect && (
            <div className="air-effect" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(135,206,235,0.3) 0%, transparent 100%)',
              animation: 'fadeOut 2s forwards',
              zIndex: 3
            }} />
          )}
          
          {earthEffect && (
            <div className="earth-effect" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(139,69,19,0.3) 0%, transparent 100%)',
              animation: 'fadeOut 2s forwards',
              zIndex: 3
            }} />
          )}
          
          {waterEffect && (
            <div className="water-effect" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(0,191,255,0.3) 0%, transparent 100%)',
              animation: 'fadeOut 2s forwards',
              zIndex: 3
            }} />
          )}
          
          {lightningEffect && (
            <div className="lightning-effect" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(255,255,0,0.3) 0%, transparent 100%)',
              animation: 'fadeOut 2s forwards',
              zIndex: 3
            }} />
          )}
        </>
      )}
      
      {/* Stats Display */}
      {isInitialized && showStats && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          zIndex: 4
        }}>
          <div>FPS: {fps.toFixed(1)}</div>
          <div>Hand: {handedness}</div>
          <div>Gesture: {detectedGesture}</div>
          <div>Discipline: {detectedDiscipline}</div>
          <div>Confidence: {(confidence * 100).toFixed(1)}%</div>
          {gestureStats.total > 0 && (
            <div>
              <div>Total: {gestureStats.total}</div>
              <div>Correct: {gestureStats.correct}</div>
              <div>Incorrect: {gestureStats.incorrect}</div>
            </div>
          )}
        </div>
      )}
      
      {/* Initialization Status */}
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px',
          textAlign: 'center',
          zIndex: 4,
          minWidth: '300px'
        }}>
          <div style={{ marginBottom: '10px' }}>{initializationStep}</div>
          {error && (
            <div style={{ 
              color: '#ff4444',
              marginTop: '10px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>
      )}
      
      <style>
        {`
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}; 
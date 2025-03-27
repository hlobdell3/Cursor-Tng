import React, { useRef, useEffect, useState } from 'react';
import { GestureDetector } from '../utils/GestureDetector';
import { HandPose, Gesture } from '../types/gesture';

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
  detector: GestureDetector;
  showStats?: boolean;
  gestures?: Gesture[];
}

export const GestureVisualizer: React.FC<GestureVisualizerProps> = ({
  detector,
  showStats = true,
  gestures = []
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState<number>(0);
  const [handedness, setHandedness] = useState<string>('');
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  
  // Start the webcam
  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            facingMode: 'user'
          },
          audio: false
        });
        
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setCameraReady(true);
          }
        };
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };
    
    setupCamera();
    
    // Clean up
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Set up the gesture detector
  useEffect(() => {
    const initializeDetector = async () => {
      if (!videoRef.current || !cameraReady) return;
      
      detector.setVideoElement(videoRef.current);
      
      if (gestures.length > 0) {
        detector.registerGestures(gestures);
      }
      
      // Hand pose detection callback
      detector.onHandPoseDetected((handPose: HandPose) => {
        setHandedness(handPose.handedness);
        drawHandPose(handPose);
      });
      
      // Gesture detection callback
      detector.onGestureDetected((gesture: Gesture) => {
        setDetectedGesture(`${gesture.name} (${Math.round(gesture.score * 100)}%)`);
        
        // Clear gesture text after 2 seconds
        setTimeout(() => {
          setDetectedGesture('');
        }, 2000);
      });
      
      // Start detection
      await detector.startDetection();
    };
    
    if (cameraReady) {
      initializeDetector();
    }
    
    // Clean up
    return () => {
      detector.stopDetection();
    };
  }, [detector, cameraReady, gestures]);
  
  // Update FPS counter
  useEffect(() => {
    const fpsInterval = setInterval(() => {
      setFps(Math.round(detector.getFps()));
    }, 500);
    
    return () => {
      clearInterval(fpsInterval);
    };
  }, [detector]);
  
  // Draw hand pose on canvas
  const drawHandPose = (handPose: HandPose) => {
    if (!canvasRef.current || !handPose.landmarks) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Flip horizontally for selfie view
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-CANVAS_WIDTH, 0);
    
    // Draw connections between landmarks
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    for (const [start, end] of HAND_CONNECTIONS) {
      const startPoint = handPose.landmarks[start];
      const endPoint = handPose.landmarks[end];
      
      if (startPoint && endPoint) {
        // Scale coordinates to canvas
        const startX = startPoint.x * CANVAS_WIDTH;
        const startY = startPoint.y * CANVAS_HEIGHT;
        const endX = endPoint.x * CANVAS_WIDTH;
        const endY = endPoint.y * CANVAS_HEIGHT;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    // Draw landmarks
    ctx.fillStyle = '#FF0000';
    
    for (const point of handPose.landmarks) {
      const x = point.x * CANVAS_WIDTH;
      const y = point.y * CANVAS_HEIGHT;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  return (
    <div className="gesture-visualizer">
      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-feed"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          playsInline
        />
        
        <canvas
          ref={canvasRef}
          className="pose-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
        
        {detectedGesture && (
          <div className="gesture-alert">
            Detected: {detectedGesture}
          </div>
        )}
        
        {showStats && (
          <div className="stats-panel">
            <div>FPS: {fps}</div>
            <div>Hand: {handedness}</div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .gesture-visualizer {
          position: relative;
          width: ${CANVAS_WIDTH}px;
          height: ${CANVAS_HEIGHT}px;
          margin: 0 auto;
        }
        
        .camera-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .camera-feed {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1); /* Mirror the webcam feed */
        }
        
        .pose-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .stats-panel {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
        }
        
        .gesture-alert {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          background: rgba(0, 150, 0, 0.8);
          color: white;
          padding: 15px;
          margin: 0 auto;
          width: fit-content;
          max-width: 80%;
          text-align: center;
          border-radius: 4px;
          font-size: 18px;
          font-weight: bold;
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}; 
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
        const disciplineName = gesture.disciplineKey;
        const confidencePercentage = Math.round(gesture.score * 100);
        
        setDetectedGesture(`You made the ${disciplineName} gesture! (${confidencePercentage}% confidence)`);
        
        // Clear gesture text after 3 seconds (increased from 2 seconds)
        setTimeout(() => {
          setDetectedGesture('');
        }, 3000); // Increased display time for better visibility
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
    
    // Draw orientation label
    const wristX = handPose.landmarks[0].x * CANVAS_WIDTH;
    const wristY = handPose.landmarks[0].y * CANVAS_HEIGHT;
    
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    const handLabel = `${handPose.handedness.toUpperCase()} HAND (Palm ${handPose.handedness === 'left' ? 'away from' : 'facing'} camera)`;
    
    // Add background for better readability
    const textWidth = ctx.measureText(handLabel).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(wristX - (textWidth / 2) - 5, wristY + 30, textWidth + 10, 24);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.fillText(handLabel, wristX, wristY + 48);
    
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
            {detectedGesture}
          </div>
        )}

        <div className="orientation-guide">
          <div className="guide-box">
            <p>In the camera view, your left hand appears on the right side of the screen.</p>
            <p>Make sure your palm is facing the camera for proper gesture detection.</p>
          </div>
        </div>
        
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
        
        .gesture-alert {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 150, 255, 0.8);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          animation: pulse 1.5s infinite;
          max-width: 80%;
        }
        
        .orientation-guide {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          z-index: 5;
        }
        
        .guide-box {
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
        }
        
        .guide-box p {
          margin: 5px 0;
        }
        
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        
        .stats-panel {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}; 
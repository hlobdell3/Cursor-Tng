import type { GestureConfig, DrawingConfig, WebcamConfig, LandmarkConnection } from './types.js';

// Gesture configurations
export const GESTURE_CONFIGS: Record<string, GestureConfig> = {
  thumbs_up: {
    name: 'thumbs_up',
    displayName: 'Thumbs Up',
    emoji: '👍',
    confidenceThreshold: 9.9
  },
  victory: {
    name: 'victory',
    displayName: 'Victory',
    emoji: '✌️',
    confidenceThreshold: 9.9
  },
  thumbs_down: {
    name: 'thumbs_down',
    displayName: 'Thumbs Down',
    emoji: '👎',
    confidenceThreshold: 9.9
  }
};

// Webcam configuration
export const WEBCAM_CONFIG: WebcamConfig = {
  width: 640,
  height: 480,
  fps: 30,
  facingMode: 'user'
};

// Drawing configuration
export const DRAWING_CONFIG: DrawingConfig = {
  connectionColor: '#00ff00',
  landmarkColor: '#ff0000',
  lineWidth: 2,
  landmarkRadius: 3
};

// Hand landmark connections for drawing the skeleton
export const HAND_CONNECTIONS: LandmarkConnection[] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];

// Detection thresholds
export const DETECTION_CONFIG = {
  gestureEstimationThreshold: 9,
  confidenceThreshold: 9.9,
  detectionInterval: 16 // ~60 FPS
} as const;

// UI Messages
export const UI_MESSAGES = {
  loading: 'Loading models...',
  loadingHandpose: 'Loading hand pose model...',
  setupGestures: 'Setting up gesture recognition...',
  ready: 'Ready! Show your hand gestures',
  noHand: 'Show your hand to detect gestures!',
  handDetected: 'Hand detected - make a gesture!',
  cameraError: 'Failed to access webcam',
  browserError: 'Browser API navigator.mediaDevices.getUserMedia is not available'
} as const; 
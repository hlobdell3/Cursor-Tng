// Type definitions for TensorFlow.js handpose model
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandPrediction {
  landmarks: number[][];
  handInViewConfidence: number;
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
  annotations: {
    [key: string]: number[][];
  };
}

// Type definitions for fingerpose library
export interface GestureEstimate {
  name: string;
  score: number;
}

export interface GestureResult {
  gestures: GestureEstimate[];
  poseData: unknown[];
}

// Application state types
export interface AppState {
  model: any; // TensorFlow handpose model
  gestureEstimator: any; // Fingerpose gesture estimator
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  isInitialized: boolean;
  isDetecting: boolean;
}

// Gesture configuration
export interface GestureConfig {
  name: string;
  displayName: string;
  emoji: string;
  confidenceThreshold: number;
}

// Canvas drawing configuration
export interface DrawingConfig {
  connectionColor: string;
  landmarkColor: string;
  lineWidth: number;
  landmarkRadius: number;
}

// Webcam configuration
export interface WebcamConfig {
  width: number;
  height: number;
  fps: number;
  facingMode: 'user' | 'environment';
}

// Status types
export type StatusType = 'loading' | 'ready' | 'error' | 'detecting';

export interface StatusUpdate {
  message: string;
  type: StatusType;
}

// Hand landmark connections for drawing skeleton
export type LandmarkConnection = [number, number];

// Gesture detection result
export interface DetectionResult {
  gesture: GestureConfig | null;
  confidence: number;
  landmarks: number[][];
} 
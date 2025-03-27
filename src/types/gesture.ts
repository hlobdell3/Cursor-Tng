// Basic 3D point type
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Hand pose detection result
export interface HandPose {
  landmarks: Point3D[];
  handedness: 'left' | 'right';
  score: number;
  timestamp: number;
}

// Motion patterns for dynamic gesture recognition
export enum MotionPattern {
  NONE = 'NONE',
  CIRCLE_CLOCKWISE = 'CIRCLE_CLOCKWISE',
  CIRCLE_COUNTERCLOCKWISE = 'CIRCLE_COUNTERCLOCKWISE',
  VERTICAL_UP_DOWN = 'VERTICAL_UP_DOWN',
  HORIZONTAL_LEFT_RIGHT = 'HORIZONTAL_LEFT_RIGHT',
  FORWARD_THRUST = 'FORWARD_THRUST',
  WAVE = 'WAVE',
  TRIANGLE = 'TRIANGLE',
  ZIG_ZAG = 'ZIG_ZAG'
}

// A single gesture definition (hand position)
export interface Gesture {
  id: string;
  name: string;
  disciplineKey: SpellDiscipline;
  threshold: number;
  fingerPositions: number[]; // Array of 5 values (0-1) for each finger extension
  description?: string;
  score?: number; // Used when a gesture is detected
  
  // Motion-based gesture properties
  motionPattern?: MotionPattern; // The pattern of movement required
  handRequired: 'left' | 'right' | 'any'; // Which hand should perform the gesture
  motionDuration?: number; // How long the motion should take (in ms)
}

// A sequence of gestures that form a spell
export interface GestureSequence {
  id: string;
  name: string;
  disciplineKey: SpellDiscipline;
  gestures: Gesture[];
  description?: string;
  maxTimeMs?: number; // Maximum time to complete the sequence
  score?: number; // Used when a sequence is detected
}

// Spell disciplines enum
export enum SpellDiscipline {
  FIRE = 'FIRE',
  WATER = 'WATER',
  AIR = 'AIR',
  EARTH = 'EARTH',
  LIGHTNING = 'LIGHTNING',
  SHADOW = 'SHADOW'
}

// Legacy types below - keeping for reference but updating implementation to use the types above

// Define the basic structures for hand and finger positions
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface FingerPosition {
  type: 'THUMB' | 'INDEX' | 'MIDDLE' | 'RING' | 'PINKY';
  joints: Vector3D[];
  extended: boolean;
}

export interface HandPosition {
  landmarks: Vector3D[];
  fingers: FingerPosition[];
  palmPosition: Vector3D;
  palmNormal: Vector3D;
  handedness: 'Left' | 'Right';
}

// Define gesture steps and sequences
export interface GestureStep {
  handPositions: HandPosition[];
  requiredAccuracy: number;
  durationMs?: number; // Optional duration this gesture should be held
}

export interface LegacyGestureSequence {
  steps: GestureStep[];
  timingTolerance: number; // How strict timing between steps should be
  name: string;
  description: string;
}

// Discipline-specific gesture identifiers
export type SpellDisciplineType = 'FIRE' | 'WATER' | 'AIR' | 'EARTH' | 'LIGHTNING' | 'SHADOW';

export interface DisciplineGesture {
  discipline: SpellDisciplineType;
  baseGesture: GestureStep[];
  visualCue: string; // Description or path to visual asset
}

// Gesture recognition results
export interface GestureRecognitionResult {
  recognizedGesture?: LegacyGestureSequence;
  recognizedDiscipline?: SpellDisciplineType;
  accuracy: number;
  confidenceScore: number;
  timestampMs: number;
}

// Training related types
export interface GestureTrainingData {
  gesture: LegacyGestureSequence;
  samples: GestureStep[][];
  minAccuracyRequired: number;
}

// Gesture Comparison Result
export interface GestureComparisonResult {
  isMatch: boolean;
  accuracy: number;
  confidenceScore: number;
  matchedGesture?: LegacyGestureSequence;
  matchedDiscipline?: SpellDisciplineType;
} 
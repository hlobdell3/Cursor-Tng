// import * as handpose from '@tensorflow-models/handpose'; // Removed this import
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { 
  HandPosition, 
  FingerPosition, 
  Vector3D, 
  GestureStep,
  GestureSequence,
  GestureRecognitionResult,
  SpellDiscipline,
  DisciplineGesture,
  GestureComparisonResult
} from '../types/gesture';
import { HandPose, Gesture } from '../types';
import { TensorFlowUtils } from '../utils/TensorFlowUtils';
import { landmarkPoints } from './gestures/landmarkPoints';

export class GestureRecognitionService {
  private model: handpose.HandPose | null = null;
  private mediaPipeModel: handPoseDetection.HandDetector | null = null;
  private isInitialized = false;
  private videoElement: HTMLVideoElement | null = null;
  private disciplineGestures: Map<SpellDiscipline, DisciplineGesture> = new Map();
  private knownGestures: GestureSequence[] = [];
  private gestureHistory: GestureStep[] = [];
  private readonly HISTORY_SIZE = 60; // Keep track of 2 seconds at 30fps
  private lastProcessedFrame = 0;
  private processingInterval = 30; // Process every 30ms
  
  // TensorFlow model configuration
  private readonly modelConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'full'
  } as const;

  constructor() {}

  /**
   * Initialize the TensorFlow.js hand tracking model
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load TensorFlow.js core
      await tf.ready();
      console.log("TensorFlow.js is ready");
      
      // Load HandPose model
      this.model = await handpose.load();
      
      // Also initialize MediaPipe model for better accuracy
      this.mediaPipeModel = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs',
          modelType: 'full',
          maxHands: 2
        }
      );
      
      console.log("Hand pose models loaded");
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error("Failed to initialize gesture recognition:", error);
      return false;
    }
  }

  /**
   * Set up the video element for tracking
   */
  public setupVideo(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
  }

  /**
   * Register discipline-specific gestures
   */
  public registerDisciplineGestures(gestures: DisciplineGesture[]): void {
    gestures.forEach(gesture => {
      this.disciplineGestures.set(gesture.discipline, gesture);
    });
    console.log(`Registered ${gestures.length} discipline gestures`);
  }

  /**
   * Register known spell gestures
   */
  public registerSpellGestures(gestures: GestureSequence[]): void {
    this.knownGestures = [...this.knownGestures, ...gestures];
    console.log(`Added ${gestures.length} spell gestures. Total: ${this.knownGestures.length}`);
  }

  /**
   * Start tracking hand gestures from the video feed
   */
  public async startTracking(): Promise<void> {
    if (!this.isInitialized || !this.videoElement) {
      throw new Error("Gesture service not properly initialized");
    }

    const processFrame = async () => {
      const now = Date.now();
      
      // Only process frames at set intervals to avoid overloading
      if (now - this.lastProcessedFrame > this.processingInterval) {
        this.lastProcessedFrame = now;
        
        // Use both models for better accuracy
        const handPoseDetection = await this.model!.estimateHands(this.videoElement!);
        const mediaPipeDetection = await this.mediaPipeModel!.estimateHands(this.videoElement!);
        
        // Process the hand landmarks
        if (handPoseDetection.length > 0 || mediaPipeDetection.length > 0) {
          // Combine detections from both models for better accuracy
          const handPositions = this.processHandDetections(handPoseDetection, mediaPipeDetection);
          
          // Create a gesture step from current hand positions
          const currentStep: GestureStep = {
            handPositions,
            requiredAccuracy: 0.8, // Default accuracy requirement
          };
          
          // Add to history and maintain history size
          this.gestureHistory.push(currentStep);
          if (this.gestureHistory.length > this.HISTORY_SIZE) {
            this.gestureHistory.shift();
          }
        }
      }
      
      // Continue tracking
      requestAnimationFrame(processFrame);
    };

    // Start the tracking loop
    processFrame();
  }

  /**
   * Process hand detections from multiple models
   */
  private processHandDetections(
    handPoseDetection: handpose.AnnotatedPrediction[],
    mediaPipeDetection: handPoseDetection.Hand[]
  ): HandPosition[] {
    const handPositions: HandPosition[] = [];

    // Process HandPose detections
    handPoseDetection.forEach(prediction => {
      const landmarks = prediction.landmarks.map(point => ({
        x: point[0],
        y: point[1],
        z: point[2]
      }));

      const fingers = this.extractFingerPositions(landmarks);
      
      handPositions.push({
        landmarks,
        fingers,
        palmPosition: this.calculatePalmPosition(landmarks),
        palmNormal: this.calculatePalmNormal(landmarks),
        handedness: prediction.handInViewConfidence > 0.5 ? 'Right' : 'Left' // Basic assumption, can be improved
      });
    });

    // Process MediaPipe detections
    mediaPipeDetection.forEach(hand => {
      const landmarks = hand.keypoints3D?.map(keypoint => ({
        x: keypoint.x,
        y: keypoint.y,
        z: keypoint.z || 0
      })) || [];

      if (landmarks.length > 0) {
        const fingers = this.extractFingerPositions(landmarks);
        
        handPositions.push({
          landmarks,
          fingers,
          palmPosition: this.calculatePalmPosition(landmarks),
          palmNormal: this.calculatePalmNormal(landmarks),
          handedness: hand.handedness[0].categoryName as 'Left' | 'Right'
        });
      }
    });

    return handPositions;
  }

  /**
   * Extract finger positions from landmarks
   */
  private extractFingerPositions(landmarks: Vector3D[]): FingerPosition[] {
    if (landmarks.length !== 21) {
      return [];
    }

    // Mapping of landmarks to fingers based on MediaPipe hand landmark model
    // Each finger has 4 points - base, knuckle, middle joint, tip
    const fingerTypes: ('THUMB' | 'INDEX' | 'MIDDLE' | 'RING' | 'PINKY')[] = [
      'THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY'
    ];

    const fingers: FingerPosition[] = [];

    // Process each finger
    for (let i = 0; i < 5; i++) {
      const baseIndex = i === 0 ? 1 : 5 + (i - 1) * 4;
      const joints = landmarks.slice(baseIndex, baseIndex + 4);
      
      // Determine if finger is extended
      const extended = this.isFingerExtended(joints, i === 0); // Special case for thumb
      
      fingers.push({
        type: fingerTypes[i],
        joints,
        extended
      });
    }

    return fingers;
  }

  /**
   * Calculate if a finger is extended
   */
  private isFingerExtended(joints: Vector3D[], isThumb: boolean): boolean {
    if (isThumb) {
      // Special case for thumb: compare distance from tip to palm
      const tipToPalmVector = {
        x: joints[3].x - joints[0].x,
        y: joints[3].y - joints[0].y,
        z: joints[3].z - joints[0].z
      };
      
      // Calculate length
      const length = Math.sqrt(
        tipToPalmVector.x * tipToPalmVector.x + 
        tipToPalmVector.y * tipToPalmVector.y + 
        tipToPalmVector.z * tipToPalmVector.z
      );
      
      return length > 0.1; // Threshold for thumb extension
    } else {
      // For other fingers: compare direction of the finger
      const baseToKnuckle = {
        x: joints[1].x - joints[0].x,
        y: joints[1].y - joints[0].y,
        z: joints[1].z - joints[0].z
      };
      
      const knuckleToTip = {
        x: joints[3].x - joints[1].x,
        y: joints[3].y - joints[1].y,
        z: joints[3].z - joints[1].z
      };
      
      // Calculate dot product to determine alignment
      const dotProduct = 
        baseToKnuckle.x * knuckleToTip.x + 
        baseToKnuckle.y * knuckleToTip.y + 
        baseToKnuckle.z * knuckleToTip.z;
      
      // Calculate magnitudes
      const baseToKnuckleMag = Math.sqrt(
        baseToKnuckle.x * baseToKnuckle.x + 
        baseToKnuckle.y * baseToKnuckle.y + 
        baseToKnuckle.z * baseToKnuckle.z
      );
      
      const knuckleToTipMag = Math.sqrt(
        knuckleToTip.x * knuckleToTip.x + 
        knuckleToTip.y * knuckleToTip.y + 
        knuckleToTip.z * knuckleToTip.z
      );
      
      // Calculate cosine of angle between vectors
      const cosAngle = dotProduct / (baseToKnuckleMag * knuckleToTipMag);
      
      // Finger is extended if vectors are roughly aligned (cos near 1)
      return cosAngle > 0.7;
    }
  }

  /**
   * Calculate palm position from landmarks
   */
  private calculatePalmPosition(landmarks: Vector3D[]): Vector3D {
    // Use wrist and knuckles to determine palm center
    const relevantPoints = [0, 5, 9, 13, 17]; // Wrist and knuckles
    const sum = relevantPoints.reduce(
      (acc, idx) => {
        acc.x += landmarks[idx].x;
        acc.y += landmarks[idx].y;
        acc.z += landmarks[idx].z;
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: sum.x / relevantPoints.length,
      y: sum.y / relevantPoints.length,
      z: sum.z / relevantPoints.length
    };
  }

  /**
   * Calculate palm normal vector from landmarks
   */
  private calculatePalmNormal(landmarks: Vector3D[]): Vector3D {
    // We need at least 3 points to calculate a normal
    if (landmarks.length < 5) {
      return { x: 0, y: 0, z: 1 };
    }

    // Use wrist and knuckles to form a plane
    const wrist = landmarks[0];
    const indexKnuckle = landmarks[5];
    const pinkyKnuckle = landmarks[17];
    
    // Calculate vectors along the palm
    const v1 = {
      x: indexKnuckle.x - wrist.x,
      y: indexKnuckle.y - wrist.y,
      z: indexKnuckle.z - wrist.z
    };
    
    const v2 = {
      x: pinkyKnuckle.x - wrist.x,
      y: pinkyKnuckle.y - wrist.y,
      z: pinkyKnuckle.z - wrist.z
    };
    
    // Calculate cross product to get normal
    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
    
    // Normalize the vector
    const magnitude = Math.sqrt(
      normal.x * normal.x + 
      normal.y * normal.y + 
      normal.z * normal.z
    );
    
    if (magnitude === 0) {
      return { x: 0, y: 0, z: 1 };
    }
    
    return {
      x: normal.x / magnitude,
      y: normal.y / magnitude,
      z: normal.z / magnitude
    };
  }

  /**
   * Check if current gestures match any known discipline gesture
   */
  public identifyDiscipline(): GestureRecognitionResult | null {
    if (this.gestureHistory.length < 5) {
      return null; // Not enough history to identify
    }
    
    // Look at the most recent gesture steps
    const recentGestures = this.gestureHistory.slice(-5);
    
    // Check against each discipline's base gesture
    let bestMatch: { discipline: SpellDiscipline, accuracy: number } | null = null;
    
    this.disciplineGestures.forEach((disciplineGesture, discipline) => {
      const comparison = this.compareGestures(
        recentGestures,
        disciplineGesture.baseGesture
      );
      
      if (comparison.isMatch && (!bestMatch || comparison.accuracy > bestMatch.accuracy)) {
        bestMatch = {
          discipline,
          accuracy: comparison.accuracy
        };
      }
    });
    
    if (bestMatch) {
      return {
        recognizedDiscipline: bestMatch.discipline,
        accuracy: bestMatch.accuracy,
        confidenceScore: bestMatch.accuracy,
        timestampMs: Date.now()
      };
    }
    
    return null;
  }

  /**
   * Check if the recent gesture history matches any known spell gestures
   */
  public identifySpellGesture(): GestureRecognitionResult | null {
    if (this.gestureHistory.length < 10) {
      return null; // Not enough history for a full spell
    }
    
    // Look at a sliding window of the gesture history
    // Most spell gestures should be completed within 1-2 seconds
    let bestMatch: { 
      gesture: GestureSequence, 
      accuracy: number,
      discipline?: SpellDiscipline
    } | null = null;
    
    // Try different window sizes for different gesture complexities
    const windowSizes = [10, 15, 20, 30];
    
    for (const windowSize of windowSizes) {
      if (this.gestureHistory.length < windowSize) continue;
      
      const gestureWindow = this.gestureHistory.slice(-windowSize);
      
      for (const knownGesture of this.knownGestures) {
        // First check if we've identified the discipline
        // This is an optimization to not check all gestures
        const disciplineResult = this.identifyDiscipline();
        if (disciplineResult) {
          // If we have a discipline, only check gestures from that discipline
          // This would require mapping gestures to disciplines in our data structure
          // For now we'll skip this optimization
        }
        
        const comparison = this.compareGestures(
          gestureWindow,
          knownGesture.steps
        );
        
        if (comparison.isMatch && (!bestMatch || comparison.accuracy > bestMatch.accuracy)) {
          bestMatch = {
            gesture: knownGesture,
            accuracy: comparison.accuracy,
            discipline: disciplineResult?.recognizedDiscipline
          };
        }
      }
    }
    
    if (bestMatch) {
      return {
        recognizedGesture: bestMatch.gesture,
        recognizedDiscipline: bestMatch.discipline,
        accuracy: bestMatch.accuracy,
        confidenceScore: bestMatch.accuracy,
        timestampMs: Date.now()
      };
    }
    
    return null;
  }

  /**
   * Compare a sequence of gestures with a template
   */
  private compareGestures(
    userGestures: GestureStep[],
    templateGestures: GestureStep[]
  ): GestureComparisonResult {
    // If template is longer than user gestures, can't be a match
    if (templateGestures.length > userGestures.length) {
      return { isMatch: false, accuracy: 0, confidenceScore: 0 };
    }
    
    // Dynamic Time Warping (DTW) would be ideal here for variable timing
    // For simplicity, we'll use a sliding window approach
    
    let bestAccuracy = 0;
    
    // Try different starting positions in user gesture sequence
    for (let i = 0; i <= userGestures.length - templateGestures.length; i++) {
      let totalAccuracy = 0;
      
      // Compare each step in the template with corresponding user gesture
      for (let j = 0; j < templateGestures.length; j++) {
        const userStep = userGestures[i + j];
        const templateStep = templateGestures[j];
        
        const stepAccuracy = this.compareGestureSteps(userStep, templateStep);
        totalAccuracy += stepAccuracy;
      }
      
      // Calculate average accuracy for this window
      const windowAccuracy = totalAccuracy / templateGestures.length;
      
      if (windowAccuracy > bestAccuracy) {
        bestAccuracy = windowAccuracy;
      }
    }
    
    // Determine if it's a match based on accuracy threshold
    const isMatch = bestAccuracy >= 0.75; // 75% accuracy threshold
    
    return {
      isMatch,
      accuracy: bestAccuracy,
      confidenceScore: bestAccuracy
    };
  }

  /**
   * Compare individual gesture steps
   */
  private compareGestureSteps(userStep: GestureStep, templateStep: GestureStep): number {
    // If hand counts don't match, poor accuracy
    if (userStep.handPositions.length !== templateStep.handPositions.length) {
      return 0.1; // Very low match
    }
    
    let totalAccuracy = 0;
    
    // Compare each hand
    for (let i = 0; i < userStep.handPositions.length; i++) {
      const userHand = userStep.handPositions[i];
      const templateHand = templateStep.handPositions[i];
      
      // Compare handedness
      if (userHand.handedness !== templateHand.handedness) {
        return 0.1; // Wrong hand used
      }
      
      // Compare finger extensions
      let fingersMatching = 0;
      for (let f = 0; f < userHand.fingers.length; f++) {
        if (userHand.fingers[f].extended === templateHand.fingers[f].extended) {
          fingersMatching++;
        }
      }
      
      const fingerAccuracy = fingersMatching / 5; // 5 fingers total
      
      // Compare palm orientation
      const dotProduct = 
        userHand.palmNormal.x * templateHand.palmNormal.x +
        userHand.palmNormal.y * templateHand.palmNormal.y +
        userHand.palmNormal.z * templateHand.palmNormal.z;
      
      const palmOrientationAccuracy = (dotProduct + 1) / 2; // Map from [-1,1] to [0,1]
      
      // Calculate hand position accuracy
      const positionAccuracy = this.comparePositions(
        userHand.palmPosition,
        templateHand.palmPosition
      );
      
      // Weighted combination of different factors
      const handAccuracy = 
        0.4 * fingerAccuracy + 
        0.4 * palmOrientationAccuracy + 
        0.2 * positionAccuracy;
      
      totalAccuracy += handAccuracy;
    }
    
    return totalAccuracy / userStep.handPositions.length;
  }

  /**
   * Compare 3D positions with normalization
   */
  private comparePositions(pos1: Vector3D, pos2: Vector3D): number {
    // Calculate Euclidean distance
    const dist = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
    
    // Normalize by expected range of hand movement
    // This depends on the scale of your coordinates
    const maxDistance = 0.5; // Adjust based on your coordinate system
    
    // Convert to similarity where 1 is perfect match, 0 is far apart
    return Math.max(0, 1 - (dist / maxDistance));
  }

  /**
   * Reset gesture history
   */
  public resetGestureHistory(): void {
    this.gestureHistory = [];
  }

  /**
   * Stop tracking
   */
  public stopTracking(): void {
    // Cleanup code here
    this.resetGestureHistory();
  }
} 
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { TensorFlowUtils } from './TensorFlowUtils';
import { HandPose, Point3D, Gesture, GestureSequence } from '../types/gesture';

/**
 * Utility class for hand pose detection and gesture recognition
 */
export class GestureDetector {
  private detector: handPoseDetection.HandDetector | null = null;
  private detectorConfig: handPoseDetection.MediaPipeHandsModelConfig = {
    runtime: 'tfjs',
    modelType: 'full',
    maxHands: 1
  };
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;
  private lastHandPose: HandPose | null = null;
  private handPoseHistory: HandPose[] = [];
  private readonly historyLength: number = 30; // Store last 30 frames of hand positions
  
  private onHandPoseDetectedCallback: ((handPose: HandPose) => void) | null = null;
  private onGestureDetectedCallback: ((gesture: Gesture) => void) | null = null;
  private onGestureSequenceDetectedCallback: ((sequence: GestureSequence) => void) | null = null;
  
  // Registered gestures and sequences for detection
  private registeredGestures: Gesture[] = [];
  private registeredSequences: GestureSequence[] = [];
  
  // Performance metrics
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = 0;
  private currentFps: number = 0;
  
  // Gesture debouncing to avoid flickering
  private lastDetectedGesture: string | null = null;
  private lastGestureTime: number = 0;
  private gestureCooldownMs: number = 1000; // Cooldown between different gesture detections
  
  /**
   * Initialize the hand pose detector
   */
  public async initialize(): Promise<boolean> {
    try {
      // Ensure TensorFlow is properly initialized
      await TensorFlowUtils.setupTensorFlow();
      
      // Create the detector
      this.detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        this.detectorConfig
      );
      
      console.log('Hand pose detector initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize hand pose detector:', error);
      return false;
    }
  }
  
  /**
   * Set the video element to use for hand pose detection
   */
  public setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }
  
  /**
   * Register gestures for detection
   */
  public registerGestures(gestures: Gesture[]): void {
    this.registeredGestures = [...gestures];
    console.log(`Registered ${gestures.length} gestures for detection`);
  }
  
  /**
   * Register gesture sequences for detection
   */
  public registerSequences(sequences: GestureSequence[]): void {
    this.registeredSequences = [...sequences];
    console.log(`Registered ${sequences.length} gesture sequences for detection`);
  }
  
  /**
   * Start the hand pose detection loop
   */
  public async startDetection(): Promise<boolean> {
    if (!this.detector) {
      console.error('Detector not initialized. Call initialize() first.');
      return false;
    }
    
    if (!this.videoElement) {
      console.error('Video element not set. Call setVideoElement() first.');
      return false;
    }
    
    this.isRunning = true;
    this.lastFpsUpdateTime = performance.now();
    this.frameCount = 0;
    
    // Start the detection loop
    this.detectionLoop();
    return true;
  }
  
  /**
   * Stop the hand pose detection loop
   */
  public stopDetection(): void {
    this.isRunning = false;
  }
  
  /**
   * Set callback for when a hand pose is detected
   */
  public onHandPoseDetected(callback: (handPose: HandPose) => void): void {
    this.onHandPoseDetectedCallback = callback;
  }
  
  /**
   * Set callback for when a gesture is detected
   */
  public onGestureDetected(callback: (gesture: Gesture) => void): void {
    this.onGestureDetectedCallback = callback;
  }
  
  /**
   * Set callback for when a gesture sequence is detected
   */
  public onGestureSequenceDetected(callback: (sequence: GestureSequence) => void): void {
    this.onGestureSequenceDetectedCallback = callback;
  }
  
  /**
   * Get the current FPS of the detection loop
   */
  public getFps(): number {
    return this.currentFps;
  }
  
  /**
   * Get the last detected hand pose
   */
  public getLastHandPose(): HandPose | null {
    return this.lastHandPose;
  }
  
  /**
   * Main detection loop
   */
  private async detectionLoop(): Promise<void> {
    if (!this.isRunning || !this.detector || !this.videoElement) {
      return;
    }
    
    try {
      // Detect hands in the current video frame
      const hands = await this.detector.estimateHands(this.videoElement);
      
      // Update FPS counter
      this.frameCount++;
      const now = performance.now();
      const elapsed = now - this.lastFpsUpdateTime;
      
      if (elapsed > 1000) {
        this.currentFps = (this.frameCount * 1000) / elapsed;
        this.frameCount = 0;
        this.lastFpsUpdateTime = now;
      }
      
      // Process detected hands
      if (hands.length > 0) {
        const hand = hands[0];
        
        // Convert the detected hand to our HandPose format
        const handPose = this.convertToHandPose(hand);
        this.lastHandPose = handPose;
        
        // Add to history, maintaining fixed length
        this.handPoseHistory.push(handPose);
        if (this.handPoseHistory.length > this.historyLength) {
          this.handPoseHistory.shift();
        }
        
        // Trigger callback
        if (this.onHandPoseDetectedCallback) {
          this.onHandPoseDetectedCallback(handPose);
        }
        
        // Check for gesture matches
        this.detectGestures(handPose);
        
        // Check for sequence matches
        this.detectSequences();
      }
    } catch (error) {
      console.error('Error in detection loop:', error);
    }
    
    // Continue the loop
    if (this.isRunning) {
      requestAnimationFrame(() => this.detectionLoop());
    }
  }
  
  /**
   * Convert the TensorFlow hand detection result to our HandPose format
   */
  private convertToHandPose(hand: handPoseDetection.Hand): HandPose {
    const keypoints: Point3D[] = hand.keypoints3D?.map(kp => ({
      x: kp.x,
      y: kp.y,
      z: kp.z || 0
    })) || [];
    
    return {
      timestamp: Date.now(),
      landmarks: keypoints,
      handedness: hand.handedness.toLowerCase() as 'left' | 'right',
      score: hand.score
    };
  }
  
  /**
   * Detect if the current hand pose matches any registered gestures
   */
  private detectGestures(currentPose: HandPose): void {
    const now = Date.now();
    let bestMatch: { gesture: Gesture, score: number } | null = null;
    
    // Find the best matching gesture
    for (const gesture of this.registeredGestures) {
      const match = this.matchGesture(currentPose, gesture);
      
      if (match.isMatch) {
        if (!bestMatch || match.score > bestMatch.score) {
          bestMatch = { 
            gesture, 
            score: match.score 
          };
        }
      }
    }
    
    // If we have a match and a callback
    if (bestMatch && this.onGestureDetectedCallback) {
      const detectedGesture: Gesture = {
        ...bestMatch.gesture,
        score: bestMatch.score
      };
      
      // Check if this is a new gesture or if the cooldown has elapsed
      const isSameGesture = this.lastDetectedGesture === detectedGesture.id;
      const isCooldownElapsed = (now - this.lastGestureTime) > this.gestureCooldownMs;
      
      // Only trigger callback if it's the same gesture (no cooldown)
      // or it's a different gesture and the cooldown has elapsed
      if (isSameGesture || isCooldownElapsed) {
        this.lastDetectedGesture = detectedGesture.id;
        this.lastGestureTime = now;
        
        this.onGestureDetectedCallback(detectedGesture);
      }
    }
  }
  
  /**
   * Detect if recent history matches any registered gesture sequences
   */
  private detectSequences(): void {
    if (this.handPoseHistory.length < 2) return;
    
    for (const sequence of this.registeredSequences) {
      const match = this.matchSequence(this.handPoseHistory, sequence);
      
      if (match.isMatch && this.onGestureSequenceDetectedCallback) {
        // Create a new sequence object with the match details
        const detectedSequence: GestureSequence = {
          ...sequence,
          score: match.score
        };
        
        this.onGestureSequenceDetectedCallback(detectedSequence);
      }
    }
  }
  
  /**
   * Check if a hand pose matches a gesture definition
   */
  private matchGesture(pose: HandPose, gesture: Gesture): { isMatch: boolean; score: number } {
    // This is a simplified matching algorithm
    // A real implementation would use more sophisticated pattern matching
    
    if (!pose.landmarks || pose.landmarks.length < 21) {
      return { isMatch: false, score: 0 };
    }
    
    // Calculate finger positions relative to palm center
    const palmCenter = this.calculatePalmCenter(pose);
    const normalizedLandmarks = pose.landmarks.map(point => ({
      x: point.x - palmCenter.x,
      y: point.y - palmCenter.y,
      z: point.z - palmCenter.z
    }));
    
    // Check against gesture definition
    // For now, just use finger extension pattern as a simple match
    const fingerExtensions = this.calculateFingerExtensions(normalizedLandmarks);
    const fingerMatch = this.matchFingerExtensionPattern(fingerExtensions, gesture.fingerPositions);
    
    return {
      isMatch: fingerMatch.score > gesture.threshold,
      score: fingerMatch.score
    };
  }
  
  /**
   * Check if hand pose history matches a sequence definition
   */
  private matchSequence(
    history: HandPose[],
    sequence: GestureSequence
  ): { isMatch: boolean; score: number } {
    if (history.length < sequence.gestures.length) {
      return { isMatch: false, score: 0 };
    }
    
    // Look for sequence in the most recent frames
    const recentHistory = history.slice(-sequence.gestures.length * 3);
    
    // Try to find the sequence within the history
    let bestScore = 0;
    let isMatch = false;
    
    // Sliding window approach to find the best match
    for (let i = 0; i <= recentHistory.length - sequence.gestures.length; i++) {
      let sequenceScore = 0;
      let allGesturesMatch = true;
      
      for (let j = 0; j < sequence.gestures.length; j++) {
        const poseMatch = this.matchGesture(
          recentHistory[i + j],
          sequence.gestures[j]
        );
        
        if (!poseMatch.isMatch) {
          allGesturesMatch = false;
          break;
        }
        
        sequenceScore += poseMatch.score;
      }
      
      if (allGesturesMatch) {
        const avgScore = sequenceScore / sequence.gestures.length;
        if (avgScore > bestScore) {
          bestScore = avgScore;
          isMatch = true;
        }
      }
    }
    
    return {
      isMatch,
      score: bestScore
    };
  }
  
  /**
   * Calculate the center of the palm from hand landmarks
   */
  private calculatePalmCenter(pose: HandPose): Point3D {
    // Palm center is approximately the average of wrist and base of middle finger
    const wrist = pose.landmarks[0];
    const middleBase = pose.landmarks[9];
    
    return {
      x: (wrist.x + middleBase.x) / 2,
      y: (wrist.y + middleBase.y) / 2,
      z: (wrist.z + middleBase.z) / 2
    };
  }
  
  /**
   * Calculate how extended each finger is (0 = closed, 1 = fully extended)
   */
  private calculateFingerExtensions(landmarks: Point3D[]): number[] {
    const extensions: number[] = [];
    
    // Finger landmark indices
    const fingerIndices = [
      [1, 2, 3, 4],       // Thumb
      [5, 6, 7, 8],       // Index
      [9, 10, 11, 12],    // Middle
      [13, 14, 15, 16],   // Ring
      [17, 18, 19, 20]    // Pinky
    ];
    
    for (const finger of fingerIndices) {
      // Calculate distance from base to tip
      const base = landmarks[finger[0]];
      const tip = landmarks[finger[3]];
      const maxLength = this.distance3D(base, tip);
      
      // Calculate length of finger joints
      let jointsLength = 0;
      for (let i = 0; i < finger.length - 1; i++) {
        const curr = landmarks[finger[i]];
        const next = landmarks[finger[i + 1]];
        jointsLength += this.distance3D(curr, next);
      }
      
      // Extension is ratio of direct distance to joints length
      // When fully extended, these are almost equal
      // When curled, direct distance is much shorter than joints length
      const extension = maxLength / (jointsLength + 0.001);
      extensions.push(Math.min(extension, 1.0));
    }
    
    return extensions;
  }
  
  /**
   * Match finger extension pattern against a gesture definition
   */
  private matchFingerExtensionPattern(
    extensions: number[],
    gesturePattern: number[]
  ): { score: number } {
    if (extensions.length !== gesturePattern.length) {
      return { score: 0 };
    }
    
    let matchScore = 0;
    const weights = [0.8, 1.2, 1.2, 1.0, 1.2]; // Give more weight to index, middle and pinky fingers
    let totalWeight = 0;
    
    for (let i = 0; i < extensions.length; i++) {
      // Calculate how close the extension matches the pattern
      // 0 = no match, 1 = perfect match
      const extensionDiff = Math.abs(extensions[i] - gesturePattern[i]);
      
      // More penalty for fingers that should be clearly extended or closed
      // For values close to 0 (closed) or close to 1 (extended), be more strict
      let fingerScore = 1 - Math.min(extensionDiff, 1);
      
      // Apply weights to different fingers
      fingerScore *= weights[i];
      matchScore += fingerScore;
      totalWeight += weights[i];
    }
    
    // Normalize score between 0 and 1
    // Apply a 1.15x multiplier to make recognition more forgiving
    // This provides a small boost but prevents too many false positives
    let finalScore = matchScore / totalWeight;
    finalScore = Math.min(finalScore * 1.15, 1.0); // Apply multiplier but cap at 1.0
    
    return { score: finalScore };
  }
  
  /**
   * Calculate 3D distance between two points
   */
  private distance3D(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Clean up resources
   */
  public async dispose(): Promise<void> {
    this.stopDetection();
    
    if (this.detector) {
      try {
        this.detector.dispose();
        this.detector = null;
      } catch (error) {
        console.error('Error disposing detector:', error);
      }
    }
    
    await TensorFlowUtils.cleanupTensorFlow();
  }
} 
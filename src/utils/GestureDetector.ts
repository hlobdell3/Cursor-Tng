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
  private gestureCooldownMs: number = 300; // Reduced cooldown between different gesture detections
  
  // Motion tracking for dynamic gestures
  private motionTrackingEnabled: boolean = false;
  private motionTrackingStartTime: number = 0;
  private motionPositionHistory: Point3D[] = [];
  private motionSamplingRate: number = 100; // ms between position samples
  private lastMotionSampleTime: number = 0;
  private activeMotionPattern: MotionPattern | null = null;
  
  /**
   * Initialize the hand pose detector
   */
  public async initialize(enableMotionTracking: boolean = true): Promise<boolean> {
    try {
      // Ensure TensorFlow is properly initialized
      await TensorFlowUtils.setupTensorFlow();
      
      // Create the detector
      this.detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        this.detectorConfig
      );
      
      this.motionTrackingEnabled = enableMotionTracking;
      
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
   * Set callback for when a motion pattern is detected
   */
  public onMotionPatternDetected(callback: (pattern: MotionPattern) => void): void {
    // We can implement this if needed to notify about detected motion patterns
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
   * Get the current active motion pattern (if any)
   */
  public getActiveMotionPattern(): MotionPattern | null {
    return this.activeMotionPattern;
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
        
        // Track motion if enabled
        if (this.motionTrackingEnabled) {
          this.trackHandMotion(handPose);
        }
        
        // Trigger callback
        if (this.onHandPoseDetectedCallback) {
          this.onHandPoseDetectedCallback(handPose);
        }
        
        // Check for gesture matches
        this.detectGestures(handPose);
        
        // Check for sequence matches
        this.detectSequences();
      } else {
        // If no hand detected for a while, reset motion tracking
        if (this.motionTrackingEnabled && (now - this.lastMotionSampleTime) > 1000) {
          this.resetMotionTracking();
        }
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
   * Track hand motion over time by sampling hand position
   */
  private trackHandMotion(handPose: HandPose): void {
    const now = Date.now();
    
    // Sample position at regular intervals
    if ((now - this.lastMotionSampleTime) >= this.motionSamplingRate) {
      // Use wrist position (landmark 0) as reference point for tracking movement
      const wristPosition = handPose.landmarks[0];
      
      // Add to motion history
      this.motionPositionHistory.push(wristPosition);
      
      // Keep only the last 30 positions (3 seconds at 100ms sampling)
      if (this.motionPositionHistory.length > 30) {
        this.motionPositionHistory.shift();
      }
      
      this.lastMotionSampleTime = now;
      
      // Detect motion patterns every 10 samples (roughly once per second)
      if (this.motionPositionHistory.length % 10 === 0 && this.motionPositionHistory.length >= 10) {
        this.detectMotionPattern();
      }
    }
  }
  
  /**
   * Reset motion tracking data
   */
  private resetMotionTracking(): void {
    this.motionPositionHistory = [];
    this.motionTrackingStartTime = 0;
    this.activeMotionPattern = null;
  }
  
  /**
   * Detect common motion patterns from position history
   */
  private detectMotionPattern(): void {
    // Need at least 10 points to detect a pattern
    if (this.motionPositionHistory.length < 10) {
      return;
    }

    // Analyze the motion path to detect patterns
    // We'll check for several common patterns:
    
    // 1. Circle detection
    const isCircle = this.detectCircularMotion();
    if (isCircle.detected) {
      this.activeMotionPattern = isCircle.clockwise ? 
        MotionPattern.CIRCLE_CLOCKWISE : MotionPattern.CIRCLE_COUNTERCLOCKWISE;
      console.log(`Detected circular motion: ${this.activeMotionPattern}`);
      return;
    }
    
    // 2. Vertical motion (up-down or down-up)
    const isVertical = this.detectVerticalMotion();
    if (isVertical) {
      this.activeMotionPattern = MotionPattern.VERTICAL_UP_DOWN;
      console.log('Detected vertical motion');
      return;
    }
    
    // 3. Horizontal motion (left-right or right-left)
    const isHorizontal = this.detectHorizontalMotion();
    if (isHorizontal) {
      this.activeMotionPattern = MotionPattern.HORIZONTAL_LEFT_RIGHT;
      console.log('Detected horizontal motion');
      return;
    }
    
    // 4. Forward thrust motion (toward camera)
    const isForwardThrust = this.detectForwardMotion();
    if (isForwardThrust) {
      this.activeMotionPattern = MotionPattern.FORWARD_THRUST;
      console.log('Detected forward thrust motion');
      return;
    }

    // 5. Wave motion (side to side repeatedly)
    const isWave = this.detectWaveMotion();
    if (isWave) {
      this.activeMotionPattern = MotionPattern.WAVE;
      console.log('Detected wave motion');
      return;
    }
    
    // If we get here, no pattern was detected
    this.activeMotionPattern = null;
  }
  
  /**
   * Detect circular motion pattern
   * Returns whether a circle was detected and if it was clockwise or counterclockwise
   */
  private detectCircularMotion(): { detected: boolean; clockwise: boolean } {
    // This is a simplified circle detection algorithm
    // A full implementation would use more sophisticated pattern matching
    
    const points = this.motionPositionHistory;
    
    // Calculate centroid of the path
    let sumX = 0, sumY = 0;
    for (const point of points) {
      sumX += point.x;
      sumY += point.y;
    }
    const centroidX = sumX / points.length;
    const centroidY = sumY / points.length;
    
    // Check if points form a rough circle by measuring distance from centroid
    let totalDistanceVariance = 0;
    const distances: number[] = [];
    
    for (const point of points) {
      const dx = point.x - centroidX;
      const dy = point.y - centroidY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      distances.push(distance);
    }
    
    // Calculate mean distance
    const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Check variance of distance (should be low for a circle)
    for (const distance of distances) {
      totalDistanceVariance += Math.pow(distance - meanDistance, 2);
    }
    const distanceVariance = totalDistanceVariance / distances.length;
    
    // Calculate direction (clockwise vs counterclockwise)
    let sumCrossProduct = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const v1x = p1.x - centroidX;
      const v1y = p1.y - centroidY;
      const v2x = p2.x - centroidX;
      const v2y = p2.y - centroidY;
      sumCrossProduct += (v1x * v2y - v1y * v2x);
    }
    
    // Ratio of variance to mean distance (lower means more circular)
    const varianceRatio = distanceVariance / meanDistance;
    
    // Thresholds for circle detection (may need tuning)
    const isCircular = varianceRatio < 0.15 && points.length >= 15;
    
    return {
      detected: isCircular,
      clockwise: sumCrossProduct < 0 // Negative cross product means clockwise
    };
  }
  
  /**
   * Detect vertical motion (up-down or down-up)
   */
  private detectVerticalMotion(): boolean {
    const points = this.motionPositionHistory;
    let verticalDistance = 0;
    let horizontalDistance = 0;
    
    // Look at the overall path from start to end
    if (points.length >= 10) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      
      // Calculate total vertical and horizontal movement
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        verticalDistance += Math.abs(p2.y - p1.y);
        horizontalDistance += Math.abs(p2.x - p1.x);
      }
      
      // Check if vertical movement dominates (at least 2x horizontal)
      return verticalDistance > horizontalDistance * 2 && verticalDistance > 0.15;
    }
    
    return false;
  }
  
  /**
   * Detect horizontal motion (left-right or right-left)
   */
  private detectHorizontalMotion(): boolean {
    const points = this.motionPositionHistory;
    let verticalDistance = 0;
    let horizontalDistance = 0;
    
    // Look at the overall path from start to end
    if (points.length >= 10) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      
      // Calculate total vertical and horizontal movement
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        verticalDistance += Math.abs(p2.y - p1.y);
        horizontalDistance += Math.abs(p2.x - p1.x);
      }
      
      // Check if horizontal movement dominates (at least 2x vertical)
      return horizontalDistance > verticalDistance * 2 && horizontalDistance > 0.15;
    }
    
    return false;
  }
  
  /**
   * Detect forward thrust motion (toward camera)
   */
  private detectForwardMotion(): boolean {
    const points = this.motionPositionHistory;
    
    // Need z-coordinate for depth perception
    if (points.length >= 10 && points[0].z !== undefined) {
      // Calculate depth movement (z-axis change)
      let depthChange = 0;
      
      for (let i = 1; i < points.length; i++) {
        depthChange += (points[i].z - points[i - 1].z);
      }
      
      // Significant forward motion (negative z change in mediapipe coordinates)
      return depthChange < -0.15;
    }
    
    return false;
  }
  
  /**
   * Detect wave motion (side to side repeatedly)
   */
  private detectWaveMotion(): boolean {
    const points = this.motionPositionHistory;
    
    if (points.length >= 15) {
      // Count direction changes in x-coordinate
      let directionChanges = 0;
      let lastDirection = 0;
      
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const direction = Math.sign(dx);
        
        if (lastDirection !== 0 && direction !== 0 && direction !== lastDirection) {
          directionChanges++;
        }
        
        if (direction !== 0) {
          lastDirection = direction;
        }
      }
      
      // At least 3 direction changes indicates a wave pattern
      return directionChanges >= 3;
    }
    
    return false;
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
      
      // Always allow the same gesture to repeat
      // Only apply cooldown when switching between different gestures
      const shouldTriggerCallback = isSameGesture || 
                                   (this.lastDetectedGesture !== detectedGesture.id && isCooldownElapsed);
      
      if (shouldTriggerCallback) {
        console.log(`Detected gesture: ${detectedGesture.name} (${Math.round(detectedGesture.score * 100)}%)`);
        
        this.lastDetectedGesture = detectedGesture.id;
        this.lastGestureTime = now;
        
        this.onGestureDetectedCallback(detectedGesture);
      }
    } else {
      // Reset the last detected gesture if no gesture is detected for a while
      const noGestureCooldown = 500; // ms
      if (this.lastDetectedGesture && (now - this.lastGestureTime) > noGestureCooldown) {
        this.lastDetectedGesture = null;
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
   * Match the current hand pose against a gesture definition
   */
  private matchGesture(pose: HandPose, gesture: Gesture): { isMatch: boolean; score: number } {
    // Check if handedness matches the gesture requirement
    if (gesture.handRequired !== 'any' && gesture.handRequired !== pose.handedness) {
      return { isMatch: false, score: 0 };
    }
    
    // First check if this is a motion-based gesture
    if (gesture.motionPattern && gesture.motionPattern !== MotionPattern.NONE) {
      // For motion-based gestures, check if the detected motion pattern matches
      if (this.activeMotionPattern === gesture.motionPattern) {
        // Motion pattern matches, return high confidence score
        return { isMatch: true, score: 0.9 };
      } else {
        // Motion pattern doesn't match
        return { isMatch: false, score: 0 };
      }
    }
    
    // For static gestures, continue with finger position matching
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
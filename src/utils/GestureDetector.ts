import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { TensorFlowUtils } from './TensorFlowUtils';
import { HandPose, Point3D, Gesture, GestureSequence, MotionPattern } from '../types/gesture';
import * as tf from '@tensorflow/tfjs';

/**
 * Utility class for hand pose detection and gesture recognition
 */
export class GestureDetector {
  private detector: handPoseDetection.HandDetector | null = null;
  private detectorConfig: handPoseDetection.MediaPipeHandsModelConfig = {
    runtime: 'tfjs',
    modelType: 'full',
    maxHands: 1,
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    scoreThreshold: 0.5,
    iouThreshold: 0.3
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
  private gestureCooldownMs: number = 200; // Reduced from 300ms to 200ms
  
  // Motion tracking for dynamic gestures
  private motionTrackingEnabled: boolean = false;
  private motionTrackingStartTime: number = 0;
  private motionPositionHistory: Point3D[] = [];
  private motionSamplingRate: number = 50; // Reduced from 100ms to 50ms for more frequent sampling
  private lastMotionSampleTime: number = 0;
  private activeMotionPattern: MotionPattern = MotionPattern.NONE;
  
  // Add new state variables for gesture activity tracking
  private isGestureActive: boolean = false;
  private gestureInactivityTimeout: number = 500; // Reduced from 1000ms to 500ms
  private lastSignificantMovement: number = 0;
  private movementThreshold: number = 0.01; // Reduced from 0.02 to 0.01 for more sensitive movement detection
  
  /**
   * Initialize the hand pose detector
   */
  public async initialize(enableMotionTracking: boolean = true): Promise<boolean> {
    try {
      // Ensure TensorFlow is properly initialized
      const tfInitialized = await TensorFlowUtils.setupTensorFlow();
      if (!tfInitialized) {
        throw new Error('Failed to initialize TensorFlow.js');
      }
      console.log(`TensorFlow.js backend: ${tf.getBackend()}`);

      // Check system requirements
      const { supported, issues } = await TensorFlowUtils.checkSystemRequirements();
      if (!supported) {
        throw new Error(`System requirements not met: ${issues.join(', ')}`);
      }
      
      console.log('Creating hand pose detector with config:', this.detectorConfig);
      
      // Create the detector
      this.detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        this.detectorConfig
      );
      
      if (!this.detector) {
        throw new Error('Failed to create hand pose detector');
      }

      // Test the detector with a dummy tensor of the correct shape
      // Shape should be [height, width, 3] for RGB image
      const testHeight = 480;
      const testWidth = 640;
      const testTensor = tf.zeros([testHeight, testWidth, 3]);
      
      try {
        // Ensure tensor is in the correct format
        const normalizedTensor = testTensor.div(255.0);
        console.log('Test tensor shape:', normalizedTensor.shape);
        
        // Run inference
        const hands = await this.detector.estimateHands(normalizedTensor);
        console.log('Test inference successful, hands detected:', hands.length);
        
        // Clean up tensors
        normalizedTensor.dispose();
        testTensor.dispose();
        
        console.log('Hand pose detector initialized and tested successfully');
        this.motionTrackingEnabled = enableMotionTracking;
        return true;
      } catch (error) {
        testTensor.dispose();
        throw error;
      }
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
    console.log(`Registered ${gestures.length} gestures for detection:`, 
      gestures.map(g => ({
        name: g.name,
        discipline: g.disciplineKey,
        motionPattern: g.motionPattern
      }))
    );
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
    if (!this.detector || !this.videoElement) {
      console.error('Cannot start detection: detector or video element not initialized');
      return false;
    }

    try {
      this.isRunning = true;
      console.log('Starting detection loop...');
      
      // Start the detection loop
      this.detectionLoop().catch(error => {
        console.error('Error in detection loop:', error);
        this.stopDetection();
      });

      console.log('Gesture detection started');
      return true;
    } catch (error) {
      console.error('Failed to start gesture detection:', error);
      this.stopDetection();
      return false;
    }
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
  public getActiveMotionPattern(): MotionPattern {
    return this.activeMotionPattern;
  }
  
  /**
   * Main detection loop
   */
  private async detectionLoop(): Promise<void> {
    if (!this.videoElement || !this.isRunning) {
      console.log('Detection loop stopped: video element missing or not running');
      return;
    }

    try {
      console.log('Starting detection loop...');
      const startTime = performance.now();
      let frameCount = 0;

      while (this.isRunning) {
        // Check if video is ready
        if (!this.videoElement || !this.videoElement.readyState || this.videoElement.readyState < 2) {
          console.log('Waiting for video to be ready...');
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Process frame
        const frame = await this.processFrame();
        if (!frame) {
          console.log('Failed to process frame, retrying...');
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Detect hand pose
        const handPose = await this.detectHandPose(frame);
        if (!handPose) {
          console.log('No hand detected in frame');
          frame.dispose();
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Log hand detection details
        console.log('Hand detected:', {
          handedness: handPose.handedness,
          score: handPose.score,
          landmarks: handPose.landmarks.length,
          timestamp: new Date().toISOString()
        });

        // Update motion history
        this.updateMotionHistory(handPose);
        console.log('Motion history updated:', {
          historyLength: this.motionPositionHistory.length,
          lastPosition: this.motionPositionHistory[this.motionPositionHistory.length - 1]
        });

        // Detect gestures
        const gesture = await this.detectGestures(handPose);
        if (gesture) {
          console.log('Gesture detected:', {
            name: gesture.name,
            discipline: gesture.disciplineKey,
            motionPattern: gesture.motionPattern,
            score: gesture.score
          });
          if (this.onGestureDetectedCallback) {
            this.onGestureDetectedCallback(gesture);
          }
        }

        // Clean up frame tensor
        frame.dispose();

        // Calculate FPS
        frameCount++;
        const elapsedTime = performance.now() - startTime;
        if (elapsedTime >= 1000) {
          const fps = (frameCount * 1000) / elapsedTime;
          console.log('Performance:', {
            fps: fps.toFixed(1),
            frameCount,
            elapsedTime: elapsedTime.toFixed(1)
          });
          frameCount = 0;
        }

        // Small delay to prevent CPU overload
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error in detection loop:', error);
      this.stopDetection();
    }
  }
  
  private async processFrame(): Promise<tf.Tensor3D | null> {
    if (!this.videoElement || !this.videoElement.readyState || this.videoElement.readyState < 2) {
      console.log('Video element not ready:', {
        readyState: this.videoElement?.readyState,
        videoWidth: this.videoElement?.videoWidth,
        videoHeight: this.videoElement?.videoHeight
      });
      return null;
    }

    try {
      // Create a tensor from the video frame
      const frame = tf.browser.fromPixels(this.videoElement);
      console.log('Frame processing:', {
        originalShape: frame.shape,
        videoWidth: this.videoElement.videoWidth,
        videoHeight: this.videoElement.videoHeight,
        readyState: this.videoElement.readyState
      });

      // Ensure the frame is in the correct format (RGB)
      const rgbFrame = frame.shape[2] === 4 ? frame.slice([0, 0, 0], [-1, -1, 3]) : frame;
      console.log('RGB conversion:', {
        originalChannels: frame.shape[2],
        rgbChannels: rgbFrame.shape[2]
      });

      // Normalize the frame to [0, 1]
      const normalizedFrame = rgbFrame.div(255.0);
      console.log('Frame normalization complete:', {
        finalShape: normalizedFrame.shape,
        minValue: normalizedFrame.min().dataSync()[0],
        maxValue: normalizedFrame.max().dataSync()[0]
      });

      return normalizedFrame as tf.Tensor3D;
    } catch (error) {
      console.error('Error processing frame:', error);
      return null;
    }
  }
  
  private async detectHandPose(frame: tf.Tensor3D): Promise<HandPose | null> {
    try {
      if (!this.detector) {
        console.error('Hand pose detector not initialized');
        return null;
      }

      // Run inference
      console.log('Starting hand detection...');
      const hands = await this.detector.estimateHands(frame);
      console.log('Hand detection results:', {
        handsDetected: hands.length,
        frameShape: frame.shape,
        timestamp: new Date().toISOString(),
        detectorConfig: this.detectorConfig
      });

      if (hands.length === 0) {
        console.log('No hands detected in frame');
        return null;
      }

      // Log details about the detected hand
      const hand = hands[0];
      console.log('Hand detection details:', {
        handedness: hand.handedness,
        score: hand.score,
        keypoints: hand.keypoints.length,
        keypoints3D: hand.keypoints3D?.length || 0
      });

      // Convert the first detected hand to our HandPose format
      const handPose = this.convertToHandPose(hand);
      
      // Update hand pose history
      this.handPoseHistory.push(handPose);
      if (this.handPoseHistory.length > this.historyLength) {
        this.handPoseHistory.shift();
      }

      // Track motion if enabled
      if (this.motionTrackingEnabled) {
        this.trackHandMotion(handPose);
      }

      // Notify callback if set
      if (this.onHandPoseDetectedCallback) {
        this.onHandPoseDetectedCallback(handPose);
      }

      return handPose;
    } catch (error) {
      console.error('Error detecting hand pose:', error);
      return null;
    }
  }
  
  /**
   * Track hand motion over time by sampling hand position
   */
  private trackHandMotion(handPose: HandPose): void {
    const now = Date.now();
    
    // Use wrist position (landmark 0) as reference point for tracking movement
    const wrist = handPose.landmarks[0];
    
    // Calculate movement from last position
    let hasSignificantMovement = false;
    if (this.motionPositionHistory.length > 0) {
      const lastPos = this.motionPositionHistory[this.motionPositionHistory.length - 1];
      const dx = wrist.x - lastPos.x;
      const dy = wrist.y - lastPos.y;
      const dz = wrist.z - lastPos.z;
      const movement = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Log movement for debugging
      console.log(`Movement detected: ${movement.toFixed(4)} (threshold: ${this.movementThreshold})`);
      
      // Check for significant movement
      hasSignificantMovement = movement > this.movementThreshold;
      
      if (hasSignificantMovement) {
        this.lastSignificantMovement = now;
        this.isGestureActive = true;
      } else if (now - this.lastSignificantMovement > this.gestureInactivityTimeout) {
        this.isGestureActive = false;
        this.resetMotionTracking();
        console.log("Gesture activity ended due to inactivity");
      }
    } else {
      hasSignificantMovement = true; // Always add first position
      this.lastSignificantMovement = now;
      this.isGestureActive = true;
    }
    
    if (hasSignificantMovement) {
      // Add wrist position to history
      this.motionPositionHistory.push(wrist);
      this.lastMotionSampleTime = now;
      
      // Log position for debugging
      console.log(`Hand position: x=${wrist.x.toFixed(3)}, y=${wrist.y.toFixed(3)}, z=${wrist.z.toFixed(3)}`);
      
      // Limit history size
      const maxHistorySize = 20; // Increased from 15 to 20 for better pattern detection
      if (this.motionPositionHistory.length > maxHistorySize) {
        this.motionPositionHistory.shift();
      }
      
      // Only attempt pattern detection if gesture is active
      if (this.isGestureActive && this.motionPositionHistory.length >= 3) {
        console.log(`Attempting motion pattern detection with ${this.motionPositionHistory.length} samples`);
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
    this.activeMotionPattern = MotionPattern.NONE;
    this.isGestureActive = false;
    this.lastSignificantMovement = 0;
  }
  
  /**
   * Detect common motion patterns from position history
   */
  private detectMotionPattern(): void {
    if (this.motionPositionHistory.length < 5) {
      console.log(`Not enough samples for motion pattern detection: ${this.motionPositionHistory.length}`);
      return;
    }
    
    // Analyze the motion path to detect common patterns
    const circularResult = this.detectCircularMotion();
    const zigzagResult = this.detectZigzagMotion();
    const twoHandClapResult = this.detectTwoHandClap();
    const wShapeResult = this.detectWShapeMotion();
    const vShapeResult = this.detectVShapeMotion();
    
    // For debugging - always log motion detection
    console.log("Motion detection check:", { 
      circular: circularResult.detected, 
      zigzag: zigzagResult,
      twoHandClap: twoHandClapResult,
      wShape: wShapeResult,
      vShape: vShapeResult,
      historyLength: this.motionPositionHistory.length,
      activePattern: this.activeMotionPattern
    });
    
    // Set the active motion pattern based on detection results
    const previousPattern = this.activeMotionPattern;
    
    // Only set a new pattern if we're confident about the detection
    if (circularResult.detected) {
      this.activeMotionPattern = circularResult.clockwise 
        ? MotionPattern.CIRCLE_CLOCKWISE 
        : MotionPattern.CIRCLE_COUNTERCLOCKWISE;
      console.log(`Circular motion detected: ${this.activeMotionPattern}`);
    } else if (zigzagResult) {
      this.activeMotionPattern = MotionPattern.ZIGZAG;
      console.log("Zigzag motion detected");
    } else if (twoHandClapResult) {
      this.activeMotionPattern = MotionPattern.TWO_HAND_CLAP;
      console.log("Two-hand clap detected");
    } else if (wShapeResult) {
      this.activeMotionPattern = MotionPattern.W_SHAPE;
      console.log("W shape motion detected");
    } else if (vShapeResult) {
      this.activeMotionPattern = MotionPattern.V_SHAPE;
      console.log("V shape motion detected");
    } else {
      // Only reset if we've had no pattern for a while
      if (this.activeMotionPattern !== MotionPattern.NONE && 
          (Date.now() - this.lastMotionSampleTime) > 1500) {
        console.log(`Resetting motion pattern from ${this.activeMotionPattern} to NONE`);
        this.activeMotionPattern = MotionPattern.NONE;
      }
    }
    
    // If pattern changed, log it clearly
    if (previousPattern !== this.activeMotionPattern) {
      console.log(`MOTION PATTERN CHANGED: ${previousPattern} → ${this.activeMotionPattern}`);
    }
  }
  
  /**
   * Detect circular motion pattern
   * Returns whether a circle was detected and if it was clockwise or counterclockwise
   */
  private detectCircularMotion(): { detected: boolean; clockwise: boolean } {
    const history = this.motionPositionHistory;
    const minPoints = 5; // Reduced from 6
    
    if (history.length < minPoints) {
      console.log(`Not enough points for circular motion detection: ${history.length} < ${minPoints}`);
      return { detected: false, clockwise: false };
    }
    
    // Find center point of the path
    let centerX = 0, centerY = 0;
    history.forEach(point => {
      centerX += point.x;
      centerY += point.y;
    });
    centerX /= history.length;
    centerY /= history.length;
    
    // Calculate angles between consecutive points relative to center
    const angles: number[] = [];
    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      const angle = Math.atan2(point.y - centerY, point.x - centerX);
      angles.push(angle);
    }
    
    // Calculate total angular change
    let totalAngularChange = 0;
    let clockwiseCount = 0;
    let counterClockwiseCount = 0;
    
    for (let i = 1; i < angles.length; i++) {
      let change = angles[i] - angles[i - 1];
      
      // Handle wrapping around ±π
      if (change > Math.PI) change -= 2 * Math.PI;
      if (change < -Math.PI) change += 2 * Math.PI;
      
      totalAngularChange += change;
      
      // Count clockwise vs counterclockwise changes
      if (change > 0) clockwiseCount++;
      if (change < 0) counterClockwiseCount++;
    }
    
    // Calculate average distance from center (radius)
    let totalDistance = 0;
    history.forEach(point => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    });
    const avgRadius = totalDistance / history.length;
    
    // Calculate average deviation from circular path
    let totalDeviation = 0;
    history.forEach(point => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalDeviation += Math.abs(distance - avgRadius);
    });
    const avgDeviation = totalDeviation / history.length;
    const deviationRatio = avgDeviation / (avgRadius + 0.001);
    
    // Calculate total path length
    let totalPathLength = 0;
    for (let i = 1; i < history.length; i++) {
      const dx = history[i].x - history[i-1].x;
      const dy = history[i].y - history[i-1].y;
      totalPathLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate circularity ratio (actual path length vs ideal circle circumference)
    const idealCircumference = 2 * Math.PI * avgRadius;
    const circularityRatio = totalPathLength / (idealCircumference + 0.001);
    
    console.log(`Circular motion check - angle change: ${totalAngularChange.toFixed(2)}, ` +
                `clockwise count: ${clockwiseCount}, counterclockwise count: ${counterClockwiseCount}, ` +
                `deviation ratio: ${deviationRatio.toFixed(2)}, ` +
                `circularity ratio: ${circularityRatio.toFixed(2)}, ` +
                `radius: ${avgRadius.toFixed(2)}`);
    
    // More lenient requirements for circular motion:
    // 1. Must have significant angular change (at least 1.5 radians)
    // 2. Must be close to circular shape (deviation ratio < 0.5)
    // 3. Path length must be close to ideal circle circumference (ratio between 0.7 and 1.3)
    // 4. Must have consistent direction (at least 55% of changes in one direction)
    const isCircular = Math.abs(totalAngularChange) > 1.5 && 
                      deviationRatio < 0.5 && 
                      circularityRatio > 0.7 && 
                      circularityRatio < 1.3;
    
    // Determine direction based on majority of changes
    const isClockwise = clockwiseCount > counterClockwiseCount;
    const directionConsistency = Math.max(clockwiseCount, counterClockwiseCount) / 
                                (clockwiseCount + counterClockwiseCount);
    
    // Only return detected if we have consistent direction
    return { 
      detected: isCircular && directionConsistency > 0.55, 
      clockwise: isClockwise 
    };
  }
  
  /**
   * Detect zigzag motion (Z shape)
   */
  private detectZigzagMotion(): boolean {
    const history = this.motionPositionHistory;
    const minPoints = 6; // Reduced from 8
    
    if (history.length < minPoints) {
      console.log(`Not enough points for zigzag detection: ${history.length} < ${minPoints}`);
      return false;
    }
    
    // Look for three distinct segments: horizontal, diagonal, horizontal
    let horizontalSegments = 0;
    let diagonalSegments = 0;
    let lastDirection = 0;
    let totalMovement = 0;
    let directionChanges = 0;
    let segmentLengths: number[] = [];
    let currentSegmentLength = 0;
    let segmentDirections: number[] = [];
    
    for (let i = 1; i < history.length; i++) {
      const dx = history[i].x - history[i-1].x;
      const dy = history[i].y - history[i-1].y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      totalMovement += movement;
      
      // Calculate movement direction
      const currentDirection = Math.atan2(dy, dx);
      
      // Check if movement is primarily horizontal or diagonal with minimum thresholds
      if (Math.abs(dy) < Math.abs(dx) * 0.4 && movement > 0.01) { // More lenient horizontal check
        horizontalSegments++;
        currentSegmentLength += movement;
        if (currentSegmentLength > 0.05) {
          segmentDirections.push(0); // horizontal
        }
      } else if (Math.abs(dy) > Math.abs(dx) * 0.6 && movement > 0.01) { // More lenient diagonal check
        diagonalSegments++;
        if (currentSegmentLength > 0) {
          segmentLengths.push(currentSegmentLength);
          currentSegmentLength = 0;
        }
        currentSegmentLength = movement;
        segmentDirections.push(1); // diagonal
      }
      
      // Count direction changes with minimum threshold
      if (lastDirection !== 0 && Math.abs(currentDirection - lastDirection) > Math.PI/2 && movement > 0.01) {
        directionChanges++;
      }
      
      lastDirection = currentDirection;
    }
    
    // Calculate average segment length
    const avgSegmentLength = segmentLengths.length > 0
      ? segmentLengths.reduce((a, b) => a + b, 0) / segmentLengths.length
      : 0;
    
    // Calculate segment pattern consistency
    let patternConsistency = 0;
    for (let i = 1; i < segmentDirections.length; i++) {
      if (segmentDirections[i] !== segmentDirections[i-1]) {
        patternConsistency++;
      }
    }
    
    console.log(`Zigzag check - horizontal segments: ${horizontalSegments}, ` +
                `diagonal segments: ${diagonalSegments}, ` +
                `direction changes: ${directionChanges}, ` +
                `total movement: ${totalMovement.toFixed(3)}, ` +
                `avg segment length: ${avgSegmentLength.toFixed(3)}, ` +
                `pattern consistency: ${patternConsistency}`);
    
    // More lenient requirements:
    // 1. At least 1 horizontal segment
    // 2. At least 1 diagonal segment
    // 3. At least 1 direction change
    // 4. Sufficient total movement
    // 5. At least 1 alternation in pattern
    return horizontalSegments >= 1 && 
           diagonalSegments >= 1 && 
           directionChanges >= 1 && 
           totalMovement > 0.15 &&
           patternConsistency >= 1;
  }
  
  /**
   * Detect two-hand clap motion
   */
  private detectTwoHandClap(): boolean {
    const history = this.motionPositionHistory;
    const minPoints = 4; // Reduced from 5
    
    if (history.length < minPoints) {
      console.log(`Not enough points for clap detection: ${history.length} < ${minPoints}`);
      return false;
    }
    
    // Look for rapid vertical movement followed by a stop
    let maxVerticalSpeed = 0;
    let lastY = history[0].y;
    let lastTime = this.lastMotionSampleTime;
    let verticalMovement = 0;
    let horizontalMovement = 0;
    
    for (let i = 1; i < history.length; i++) {
      const currentY = history[i].y;
      const currentX = history[i].x;
      const timeDiff = this.lastMotionSampleTime - lastTime;
      
      if (timeDiff > 0) {
        const verticalSpeed = Math.abs(currentY - lastY) / timeDiff;
        const horizontalSpeed = Math.abs(currentX - history[i-1].x) / timeDiff;
        
        maxVerticalSpeed = Math.max(maxVerticalSpeed, verticalSpeed);
        verticalMovement += Math.abs(currentY - lastY);
        horizontalMovement += Math.abs(currentX - history[i-1].x);
      }
      
      lastY = currentY;
      lastTime = this.lastMotionSampleTime;
    }
    
    // Calculate movement ratio (vertical vs horizontal)
    const movementRatio = verticalMovement / (horizontalMovement + 0.001);
    
    console.log(`Two-hand clap check - max vertical speed: ${maxVerticalSpeed.toFixed(3)}, ` +
                `total vertical movement: ${verticalMovement.toFixed(3)}, ` +
                `movement ratio: ${movementRatio.toFixed(3)}`);
    
    // More lenient requirements:
    // 1. Rapid vertical movement
    // 2. Sufficient total vertical movement
    // 3. Movement should be primarily vertical (ratio > 1.5)
    return maxVerticalSpeed > 0.3 && 
           verticalMovement > 0.08 && 
           movementRatio > 1.5;
  }
  
  /**
   * Detect W shape motion
   */
  private detectWShapeMotion(): boolean {
    const history = this.motionPositionHistory;
    const minPoints = 6; // Reduced from 8
    
    if (history.length < minPoints) {
      console.log(`Not enough points for W shape detection: ${history.length} < ${minPoints}`);
      return false;
    }
    
    // Look for three peaks in the vertical movement
    let peaks = 0;
    let valleys = 0;
    let lastY = history[0].y;
    let isRising = false;
    let totalVerticalMovement = 0;
    let lastPeakY = 0;
    let lastValleyY = 0;
    let peakDistances: number[] = [];
    let peakTimes: number[] = [];
    let lastPeakTime = 0;
    
    for (let i = 1; i < history.length; i++) {
      const currentY = history[i].y;
      const yChange = currentY - lastY;
      totalVerticalMovement += Math.abs(yChange);
      
      // Detect direction changes with minimum threshold
      if (yChange > 0.015 && !isRising) { // More lenient threshold
        valleys++;
        lastValleyY = currentY;
        isRising = true;
      } else if (yChange < -0.015 && isRising) { // More lenient threshold
        peaks++;
        lastPeakY = currentY;
        if (peaks > 1) {
          peakDistances.push(Math.abs(lastPeakY - lastValleyY));
          peakTimes.push(i - lastPeakTime);
        }
        lastPeakTime = i;
        isRising = false;
      }
      
      lastY = currentY;
    }
    
    // Calculate average peak-to-valley distance
    const avgPeakValleyDistance = peakDistances.length > 0 
      ? peakDistances.reduce((a, b) => a + b, 0) / peakDistances.length 
      : 0;
    
    // Calculate consistency of peak distances
    const peakDistanceVariance = peakDistances.length > 0
      ? peakDistances.reduce((acc, dist) => acc + Math.pow(dist - avgPeakValleyDistance, 2), 0) / peakDistances.length
      : 0;
    
    // Calculate average time between peaks
    const avgPeakTime = peakTimes.length > 0
      ? peakTimes.reduce((a, b) => a + b, 0) / peakTimes.length
      : 0;
    
    // Calculate consistency of peak timing
    const peakTimeVariance = peakTimes.length > 0
      ? peakTimes.reduce((acc, time) => acc + Math.pow(time - avgPeakTime, 2), 0) / peakTimes.length
      : 0;
    
    console.log(`W shape check - peaks: ${peaks}, valleys: ${valleys}, ` +
                `total movement: ${totalVerticalMovement.toFixed(3)}, ` +
                `avg peak-valley distance: ${avgPeakValleyDistance.toFixed(3)}, ` +
                `distance variance: ${peakDistanceVariance.toFixed(3)}, ` +
                `avg peak time: ${avgPeakTime.toFixed(1)}, ` +
                `time variance: ${peakTimeVariance.toFixed(1)}`);
    
    // More lenient requirements:
    // 1. At least 2 peaks and 1 valley
    // 2. Sufficient vertical movement
    // 3. Reasonable peak-to-valley distances
    // 4. Reasonable timing between peaks
    return peaks >= 2 && 
           valleys >= 1 && 
           totalVerticalMovement > 0.1 &&
           avgPeakValleyDistance > 0.03 &&
           peakDistanceVariance < 0.02 &&
           peakTimeVariance < 10;
  }
  
  /**
   * Detect V shape motion
   */
  private detectVShapeMotion(): boolean {
    const history = this.motionPositionHistory;
    const minPoints = 4; // Reduced from 5
    
    if (history.length < minPoints) {
      console.log(`Not enough points for V shape detection: ${history.length} < ${minPoints}`);
      return false;
    }
    
    // Look for two distinct diagonal movements forming a V
    let diagonalSegments = 0;
    let lastDirection = 0;
    let totalMovement = 0;
    let directionChanges = 0;
    
    for (let i = 1; i < history.length; i++) {
      const dx = history[i].x - history[i-1].x;
      const dy = history[i].y - history[i-1].y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      totalMovement += movement;
      
      // Calculate movement direction
      const currentDirection = Math.atan2(dy, dx);
      
      // Check if movement is diagonal with minimum threshold
      if (Math.abs(dy) > Math.abs(dx) * 0.4 && movement > 0.01) { // More lenient diagonal check
        // Check for direction change
        if (lastDirection !== 0 && Math.abs(currentDirection - lastDirection) > Math.PI/2) {
          directionChanges++;
        }
      }
      
      lastDirection = currentDirection;
    }
    
    console.log(`V shape check - diagonal segments: ${diagonalSegments}, ` +
                `direction changes: ${directionChanges}, ` +
                `total movement: ${totalMovement.toFixed(3)}`);
    
    // More lenient requirements:
    // 1. At least 1 diagonal segment
    // 2. At least 1 direction change
    // 3. Sufficient total movement
    return diagonalSegments >= 1 && 
           directionChanges >= 1 && 
           totalMovement > 0.1;
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
  private detectGestures(currentPose: HandPose): Gesture | null {
    const now = Date.now();

    // Track hand motion
    this.trackHandMotion(currentPose);

    // Get the current motion pattern
    this.detectMotionPattern();
    
    // Log current state for debugging
    console.log('Gesture Detection State:', {
      activePattern: this.activeMotionPattern,
      motionHistoryLength: this.motionPositionHistory.length,
      lastGesture: this.lastDetectedGesture,
      timeSinceLastGesture: now - this.lastGestureTime,
      registeredGestures: this.registeredGestures.map(g => ({
        name: g.name,
        discipline: g.disciplineKey,
        motionPattern: g.motionPattern
      }))
    });

    // Find matching gesture based on motion pattern
    let matchedGesture: Gesture | null = null;

    // Only proceed if we have an active motion pattern
    if (this.activeMotionPattern === MotionPattern.NONE) {
      console.log('No active motion pattern, skipping gesture detection');
      return null;
    }

    // Check each registered gesture
    for (const gesture of this.registeredGestures) {
      // Skip if gesture requires a specific hand and we're using the wrong one
      if (gesture.handRequired !== 'any' && gesture.handRequired !== currentPose.handedness) {
        console.log(`Skipping ${gesture.name} - wrong hand: required ${gesture.handRequired}, got ${currentPose.handedness}`);
        continue;
      }

      // For motion-based gestures, require exact pattern match
      if (gesture.motionPattern) {
        if (this.activeMotionPattern === gesture.motionPattern) {
          console.log(`Motion pattern matched for ${gesture.name} (${gesture.disciplineKey}): ${gesture.motionPattern}`);
          matchedGesture = gesture;
          break; // Found exact match, no need to check others
        } else {
          console.log(`Motion pattern mismatch for ${gesture.name} (${gesture.disciplineKey}): expected ${gesture.motionPattern}, got ${this.activeMotionPattern}`);
        }
      }
    }

    // Log gesture matching results
    if (matchedGesture) {
      console.log('Gesture Match Found:', {
        gesture: matchedGesture.name,
        discipline: matchedGesture.disciplineKey,
        motionPattern: matchedGesture.motionPattern,
        activePattern: this.activeMotionPattern
      });

      // Only trigger gesture detection if it's been long enough since last detection
      if (now - this.lastGestureTime >= this.gestureCooldownMs) {
        // Update last detected gesture and time
        this.lastDetectedGesture = matchedGesture.name;
        this.lastGestureTime = now;

        // Call the gesture detected callback with the matched gesture
        if (this.onGestureDetectedCallback) {
          const detectedGesture: Gesture = {
            ...matchedGesture,
            score: 1.0
          };
          console.log('Triggering gesture callback:', detectedGesture);
          this.onGestureDetectedCallback(detectedGesture);
        }

        // Reset motion tracking after successful detection
        this.resetMotionTracking();
      } else {
        console.log('Skipping gesture detection due to cooldown:', {
          timeSinceLastGesture: now - this.lastGestureTime,
          cooldownMs: this.gestureCooldownMs
        });
      }
    } else {
      console.log('No Gesture Match:', {
        activePattern: this.activeMotionPattern,
        motionHistoryLength: this.motionPositionHistory.length,
        registeredGestures: this.registeredGestures.map(g => ({
          name: g.name,
          discipline: g.disciplineKey,
          motionPattern: g.motionPattern
        }))
      });
    }

    return matchedGesture;
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
        console.log(`Motion pattern matched for ${gesture.name}: ${gesture.motionPattern}`);
        return { isMatch: true, score: 0.95 }; // Increased from 0.9 for better detection
      } else {
        // Log why the motion pattern didn't match
        console.log(`Motion pattern mismatch for ${gesture.name}: expected ${gesture.motionPattern}, got ${this.activeMotionPattern}`);
        return { isMatch: false, score: 0 };
      }
    }
    
    // For static gestures, continue with finger position matching
    if (!pose.landmarks || pose.landmarks.length < 21) {
      console.log('Not enough landmarks for gesture detection');
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
    const fingerExtensions = this.calculateFingerExtensions(normalizedLandmarks);
    const fingerMatch = this.matchFingerExtensionPattern(fingerExtensions, gesture.fingerPositions);
    
    const result = {
      isMatch: fingerMatch.score > gesture.threshold,
      score: fingerMatch.score
    };
    
    // Log finger matching results
    console.log(`Finger matching for ${gesture.name}:`, {
      score: fingerMatch.score,
      threshold: gesture.threshold,
      isMatch: result.isMatch
    });
    
    return result;
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
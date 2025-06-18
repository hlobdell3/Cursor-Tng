// Global fingerpose reference (loaded from CDN)
declare const fp: any;

/**
 * Creates a custom thumbs down gesture using the fingerpose library
 * @returns A fingerpose GestureDescription for thumbs down
 */
export function createThumbsDownGesture(): any {
  const thumbsDown = new fp.GestureDescription('thumbs_down');

  // Thumb should be straight and pointing down
  thumbsDown.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl);
  thumbsDown.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
  thumbsDown.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.9);
  thumbsDown.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.9);

  // Other fingers should be curled into the palm
  const fingers = [
    fp.Finger.Index,
    fp.Finger.Middle,
    fp.Finger.Ring,
    fp.Finger.Pinky,
  ];

  fingers.forEach((finger) => {
    thumbsDown.addCurl(finger, fp.FingerCurl.FullCurl, 0.9);
    thumbsDown.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
  });

  return thumbsDown;
}

/**
 * Creates and returns all known gestures for the application
 * @returns Array of gesture descriptions
 */
export function createKnownGestures(): any[] {
  const thumbsDownGesture = createThumbsDownGesture();
  
  return [
    fp.Gestures.VictoryGesture,
    fp.Gestures.ThumbsUpGesture,
    thumbsDownGesture,
  ];
}

/**
 * Creates a gesture estimator with all known gestures
 * @returns A fingerpose GestureEstimator instance
 */
export function createGestureEstimator(): any {
  const knownGestures = createKnownGestures();
  return new fp.GestureEstimator(knownGestures);
}

/**
 * Example function for creating additional custom gestures
 * This can be extended to add more gestures like peace sign, rock sign, etc.
 */
export function createPeaceGesture(): any {
  const peace = new fp.GestureDescription('peace');
  
  // Index and middle finger should be straight and up
  peace.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  peace.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  
  peace.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
  peace.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
  
  // Thumb, ring, and pinky should be curled
  const curledFingers = [fp.Finger.Thumb, fp.Finger.Ring, fp.Finger.Pinky];
  
  curledFingers.forEach((finger) => {
    peace.addCurl(finger, fp.FingerCurl.FullCurl, 0.9);
    peace.addCurl(finger, fp.FingerCurl.HalfCurl, 0.8);
  });
  
  return peace;
}

/**
 * Creates a rock/horns gesture (index and pinky extended)
 */
export function createRockGesture(): any {
  const rock = new fp.GestureDescription('rock');
  
  // Index and pinky should be straight and up
  rock.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  rock.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
  
  rock.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
  rock.addDirection(fp.Finger.Pinky, fp.FingerDirection.VerticalUp, 1.0);
  
  // Thumb, middle, and ring should be curled
  const curledFingers = [fp.Finger.Thumb, fp.Finger.Middle, fp.Finger.Ring];
  
  curledFingers.forEach((finger) => {
    rock.addCurl(finger, fp.FingerCurl.FullCurl, 0.9);
    rock.addCurl(finger, fp.FingerCurl.HalfCurl, 0.8);
  });
  
  return rock;
} 
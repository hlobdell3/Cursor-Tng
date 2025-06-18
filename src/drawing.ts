import type { DrawingConfig } from './types.js';
import { DRAWING_CONFIG, HAND_CONNECTIONS } from './config.js';

/**
 * Sets up the canvas element for drawing
 * @param video The video element to match dimensions
 * @returns Object containing canvas and context
 */
export function setupCanvas(video: HTMLVideoElement): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // Set canvas dimensions to match video
  canvas.width = video.width;
  canvas.height = video.height;

  return { canvas, ctx };
}

/**
 * Draws the video frame onto the canvas
 * @param ctx Canvas rendering context
 * @param video Video element to draw
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement
): void {
  ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws hand landmarks and connections on the canvas
 * @param ctx Canvas rendering context
 * @param landmarks Array of landmark coordinates [x, y]
 * @param config Drawing configuration (optional)
 */
export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: number[][],
  config: DrawingConfig = DRAWING_CONFIG
): void {
  if (!landmarks || landmarks.length === 0) {
    return;
  }

  // Draw connections between landmarks
  drawHandConnections(ctx, landmarks, config);
  
  // Draw landmark points
  drawLandmarkPoints(ctx, landmarks, config);
}

/**
 * Draws connections between hand landmarks
 * @param ctx Canvas rendering context
 * @param landmarks Array of landmark coordinates
 * @param config Drawing configuration
 */
function drawHandConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: number[][],
  config: DrawingConfig
): void {
  ctx.strokeStyle = config.connectionColor;
  ctx.lineWidth = config.lineWidth;
  ctx.beginPath();

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const startPoint = landmarks[startIdx];
    const endPoint = landmarks[endIdx];

    if (startPoint && endPoint && startPoint.length >= 2 && endPoint.length >= 2) {
      const [startX, startY] = startPoint;
      const [endX, endY] = endPoint;
      
      if (typeof startX === 'number' && typeof startY === 'number' && 
          typeof endX === 'number' && typeof endY === 'number') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
    }
  });

  ctx.stroke();
}

/**
 * Draws individual landmark points
 * @param ctx Canvas rendering context
 * @param landmarks Array of landmark coordinates
 * @param config Drawing configuration
 */
function drawLandmarkPoints(
  ctx: CanvasRenderingContext2D,
  landmarks: number[][],
  config: DrawingConfig
): void {
  ctx.fillStyle = config.landmarkColor;

  landmarks.forEach((landmark) => {
    if (landmark && landmark.length >= 2) {
      const [x, y] = landmark;
      if (typeof x === 'number' && typeof y === 'number') {
        ctx.beginPath();
        ctx.arc(x, y, config.landmarkRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
}

/**
 * Clears the canvas
 * @param ctx Canvas rendering context
 */
export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws a bounding box around detected hand
 * @param ctx Canvas rendering context
 * @param boundingBox Bounding box coordinates
 * @param color Box color (optional)
 */
export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  boundingBox: { topLeft: [number, number]; bottomRight: [number, number] },
  color: string = '#00ff00'
): void {
  const [x1, y1] = boundingBox.topLeft;
  const [x2, y2] = boundingBox.bottomRight;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Draws gesture information on the canvas
 * @param ctx Canvas rendering context
 * @param gestureName Name of the detected gesture
 * @param confidence Confidence score
 * @param position Position to draw the text
 */
export function drawGestureInfo(
  ctx: CanvasRenderingContext2D,
  gestureName: string,
  confidence: number,
  position: { x: number; y: number } = { x: 10, y: 30 }
): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.font = '20px Arial';
  ctx.lineWidth = 3;
  
  const text = `${gestureName} (${(confidence * 10).toFixed(1)}%)`;
  
  // Draw text outline
  ctx.strokeText(text, position.x, position.y);
  // Draw text fill
  ctx.fillText(text, position.x, position.y);
}

/**
 * Creates a custom drawing configuration
 * @param overrides Partial configuration to override defaults
 * @returns Complete drawing configuration
 */
export function createDrawingConfig(
  overrides: Partial<DrawingConfig> = {}
): DrawingConfig {
  return {
    ...DRAWING_CONFIG,
    ...overrides
  };
}

/**
 * Animates a pulse effect on detected landmarks
 * @param ctx Canvas rendering context
 * @param landmarks Array of landmark coordinates
 * @param timestamp Current timestamp for animation
 */
export function drawPulsingLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: number[][],
  timestamp: number
): void {
  const pulseRadius = 3 + Math.sin(timestamp * 0.01) * 2;
  const alpha = 0.7 + Math.sin(timestamp * 0.008) * 0.3;
  
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
  
  landmarks.forEach((landmark) => {
    if (landmark && landmark.length >= 2) {
      const [x, y] = landmark;
      if (typeof x === 'number' && typeof y === 'number') {
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
} 
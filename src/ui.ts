import type { StatusType, StatusUpdate } from './types.js';
import { GESTURE_CONFIGS } from './config.js';

/**
 * Updates the status message and styling
 * @param message Status message to display
 * @param type Status type for styling
 */
export function updateStatus(message: string, type: StatusType): void {
  const statusElement = document.getElementById('status');
  if (!statusElement) {
    console.warn('Status element not found');
    return;
  }

  statusElement.textContent = message;
  statusElement.className = type;
}

/**
 * Updates the gesture display text
 * @param gestureName Name of the detected gesture
 */
export function updateGestureDisplay(gestureName: string): void {
  const gestureElement = document.getElementById('gesture-text');
  if (!gestureElement) {
    console.warn('Gesture text element not found');
    return;
  }

  const config = GESTURE_CONFIGS[gestureName];
  if (config) {
    gestureElement.textContent = `${config.emoji} ${config.displayName}`;
  } else {
    gestureElement.textContent = gestureName;
  }
}

/**
 * Clears the gesture display
 * @param fallbackMessage Optional fallback message to display
 */
export function clearGestureDisplay(fallbackMessage?: string): void {
  const gestureElement = document.getElementById('gesture-text');
  if (!gestureElement) {
    console.warn('Gesture text element not found');
    return;
  }

  gestureElement.textContent = fallbackMessage || 'Show your hand to detect gestures!';
}

/**
 * Creates a status update object
 * @param message Status message
 * @param type Status type
 * @returns StatusUpdate object
 */
export function createStatusUpdate(message: string, type: StatusType): StatusUpdate {
  return { message, type };
}

/**
 * Displays an error message to the user
 * @param error Error object or message
 */
export function displayError(error: Error | string): void {
  const message = error instanceof Error ? error.message : error;
  updateStatus(`Error: ${message}`, 'error');
  console.error('Application error:', error);
}

/**
 * Shows a loading indicator
 * @param message Optional loading message
 */
export function showLoading(message: string = 'Loading...'): void {
  updateStatus(message, 'loading');
}

/**
 * Shows ready state
 * @param message Optional ready message
 */
export function showReady(message: string = 'Ready!'): void {
  updateStatus(message, 'ready');
}

/**
 * Gets all DOM elements needed for the application
 * @returns Object containing all required DOM elements
 */
export function getDOMElements(): {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  gestureText: HTMLElement;
  status: HTMLElement;
} {
  const video = document.getElementById('webcam') as HTMLVideoElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gestureText = document.getElementById('gesture-text') as HTMLElement;
  const status = document.getElementById('status') as HTMLElement;

  if (!video) throw new Error('Video element not found');
  if (!canvas) throw new Error('Canvas element not found');
  if (!gestureText) throw new Error('Gesture text element not found');
  if (!status) throw new Error('Status element not found');

  return { video, canvas, gestureText, status };
}

/**
 * Validates that all required DOM elements exist
 * @returns True if all elements exist, false otherwise
 */
export function validateDOMElements(): boolean {
  try {
    getDOMElements();
    return true;
  } catch (error) {
    console.error('DOM validation failed:', error);
    return false;
  }
}

/**
 * Creates a notification element for temporary messages
 * @param message Message to display
 * @param type Notification type
 * @param duration Duration in milliseconds (default: 3000)
 */
export function showNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 3000
): void {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '4px',
    color: 'white',
    fontWeight: 'bold',
    zIndex: '1000',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
    backgroundColor: type === 'success' ? '#28a745' : 
                    type === 'error' ? '#dc3545' : '#007bff'
  });

  // Add to document
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * Adds keyboard shortcuts for the application
 */
export function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'Escape':
        // Could be used to stop detection or close modals
        event.preventDefault();
        showNotification('Press F5 to restart the application', 'info');
        break;
      case 'F1':
        // Show help
        event.preventDefault();
        showNotification('Hold your hand in front of the camera and make gestures!', 'info', 5000);
        break;
      case ' ':
        // Spacebar could toggle detection pause (if implemented)
        event.preventDefault();
        showNotification('Spacebar pressed - feature not implemented', 'info');
        break;
    }
  });
}

/**
 * Formats confidence score for display
 * @param score Raw confidence score (0-10)
 * @returns Formatted percentage string
 */
export function formatConfidence(score: number): string {
  return `${(score * 10).toFixed(1)}%`;
}

/**
 * Creates a debug panel for development
 * @param landmarks Current hand landmarks
 * @param gesture Current gesture information
 */
export function updateDebugPanel(
  landmarks: number[][] | null,
  gesture: { name: string; confidence: number } | null
): void {
  let debugPanel = document.getElementById('debug-panel');
  
  if (!debugPanel) {
    debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      max-width: 300px;
      z-index: 999;
      display: none;
    `;
    document.body.appendChild(debugPanel);
  }

  // Toggle debug panel with Ctrl+D
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault();
      debugPanel!.style.display = debugPanel!.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Update debug information
  const landmarkCount = landmarks ? landmarks.length : 0;
  const gestureInfo = gesture ? `${gesture.name} (${formatConfidence(gesture.confidence)})` : 'None';
  
  debugPanel.innerHTML = `
    <strong>Debug Info</strong><br>
    Landmarks: ${landmarkCount}<br>
    Gesture: ${gestureInfo}<br>
    <small>Press Ctrl+D to toggle</small>
  `;
} 
import type { WebcamConfig } from './types.js';
import { UI_MESSAGES } from './config.js';

/**
 * Loads and initializes the webcam stream
 * @param config Webcam configuration options
 * @returns Promise that resolves to the video element
 */
export async function loadWebcam(config: WebcamConfig): Promise<HTMLVideoElement> {
  // Check if browser supports getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(UI_MESSAGES.browserError);
  }

  const video = document.getElementById('webcam') as HTMLVideoElement;
  if (!video) {
    throw new Error('Video element not found');
  }

  // Configure video element
  video.muted = true;
  video.width = config.width;
  video.height = config.height;

  // Set up media constraints
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: config.facingMode,
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { max: config.fps }
    }
  };

  try {
    // Request webcam access
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Wait for video metadata to load
    return new Promise<HTMLVideoElement>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play()
          .then(() => resolve(video))
          .catch(reject);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`${UI_MESSAGES.cameraError}: ${message}`);
  }
}

/**
 * Stops the webcam stream and releases resources
 * @param video The video element to stop
 */
export function stopWebcam(video: HTMLVideoElement): void {
  const stream = video.srcObject as MediaStream;
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

/**
 * Checks if the browser supports the required webcam features
 * @returns True if webcam is supported, false otherwise
 */
export function isWebcamSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Gets available video input devices
 * @returns Promise that resolves to an array of video input devices
 */
export async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  if (!isWebcamSupported()) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.warn('Failed to enumerate video devices:', error);
    return [];
  }
}

/**
 * Switches to a different video device
 * @param video The video element
 * @param deviceId The ID of the device to switch to
 * @param config Webcam configuration
 * @returns Promise that resolves when the switch is complete
 */
export async function switchVideoDevice(
  video: HTMLVideoElement, 
  deviceId: string, 
  config: WebcamConfig
): Promise<void> {
  // Stop current stream
  stopWebcam(video);

  // Create new constraints with specific device
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { max: config.fps }
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    return new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play()
          .then(() => resolve())
          .catch(reject);
      };
      video.onerror = () => reject(new Error('Failed to switch video device'));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to switch video device: ${message}`);
  }
} 
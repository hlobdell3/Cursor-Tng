import * as tf from '@tensorflow/tfjs';

/**
 * Utility functions for TensorFlow setup and management
 */
export class TensorFlowUtils {
  /**
   * Check if WebGL is supported and set up TensorFlow accordingly
   */
  static async setupTensorFlow(): Promise<boolean> {
    try {
      // Check if WebGL is available
      const webGLSupported = tf.ENV.get('WEBGL_VERSION') > 0;
      
      if (webGLSupported) {
        console.log('WebGL is supported. Using WebGL backend for TensorFlow.js');
        await tf.setBackend('webgl');
      } else {
        console.warn('WebGL is not supported. Using CPU fallback (this will be slower)');
        await tf.setBackend('cpu');
      }
      
      // Enable memory cleanup
      tf.ENV.set('AUTO_RELEASE_TENSORS', true);
      
      // Wait for backend initialization
      await tf.ready();
      console.log(`TensorFlow.js initialized with ${tf.getBackend()} backend`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow:', error);
      return false;
    }
  }

  /**
   * Clean up TensorFlow resources
   */
  static cleanupTensorFlow(): void {
    try {
      // Dispose any remaining tensors
      tf.disposeVariables();
      
      // Optional: Force garbage collection
      if ('gc' in window) {
        (window as any).gc();
      }
      
      console.log('TensorFlow resources cleaned up');
    } catch (error) {
      console.error('Error cleaning up TensorFlow resources:', error);
    }
  }

  /**
   * Check if the system meets requirements for gesture recognition
   */
  static async checkSystemRequirements(): Promise<{
    supported: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let supported = true;
    
    // Check WebGL support
    const webGLSupported = tf.ENV.get('WEBGL_VERSION') > 0;
    if (!webGLSupported) {
      issues.push('WebGL is not supported. Performance will be degraded.');
      // Still supported, but slow
    }
    
    // Check for camera access
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!hasCamera) {
        issues.push('No camera detected.');
        supported = false;
      }
    } catch (error) {
      issues.push('Error accessing media devices.');
      supported = false;
    }
    
    return { supported, issues };
  }

  /**
   * Calculates memory usage and returns stats
   */
  static getMemoryStats(): { 
    numTensors: number, 
    numDataBuffers: number, 
    memoryUsage: number 
  } {
    return {
      numTensors: tf.memory().numTensors,
      numDataBuffers: tf.memory().numDataBuffers,
      memoryUsage: tf.memory().numBytes
    };
  }
} 
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
      // Register the AUTO_RELEASE_TENSORS flag
      tf.ENV.registerFlag('AUTO_RELEASE_TENSORS', () => true);
      
      // Check if WebGL is available
      const webGLSupported = tf.ENV.get('WEBGL_VERSION') > 0;
      
      if (webGLSupported) {
        console.log('WebGL is supported. Using WebGL backend for TensorFlow.js');
        await tf.setBackend('webgl');
        
        // Configure WebGL backend for better performance
        const gl = await tf.backend().getGPGPUContext().gl;
        // Try to get extensions but don't fail if they're not available
        try {
          gl.getExtension('EXT_color_buffer_float');
          gl.getExtension('OES_texture_float_linear');
        } catch (error) {
          console.warn('Some WebGL extensions are not available, but continuing anyway:', error);
        }
      } else {
        console.warn('WebGL is not supported. Using CPU fallback (this will be slower)');
        await tf.setBackend('cpu');
      }
      
      // Enable memory cleanup
      tf.ENV.set('AUTO_RELEASE_TENSORS', true);
      
      // Wait for backend initialization
      await tf.ready();
      console.log(`TensorFlow.js initialized with ${tf.getBackend()} backend`);
      
      // Test tensor operations
      const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
      const result = testTensor.matMul(testTensor);
      await result.data();
      testTensor.dispose();
      result.dispose();
      
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

    // Check WebGL support
    const webGLSupported = tf.ENV.get('WEBGL_VERSION') > 0;
    if (!webGLSupported) {
      issues.push('WebGL is not supported in your browser');
    }

    // Check for MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('Camera access is not supported in your browser');
    }

    // Check for required WebGL extensions but don't fail if they're missing
    if (webGLSupported) {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const extensions = [
          'EXT_color_buffer_float',
          'OES_texture_float_linear',
          'WEBGL_lose_context'
        ];

        extensions.forEach(ext => {
          if (!gl.getExtension(ext)) {
            console.warn(`WebGL extension ${ext} is not supported, but continuing anyway`);
            // Don't add to issues array anymore
          }
        });
      }
    }

    // Only consider camera access as a critical requirement
    return {
      supported: !issues.includes('Camera access is not supported in your browser'),
      issues
    };
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
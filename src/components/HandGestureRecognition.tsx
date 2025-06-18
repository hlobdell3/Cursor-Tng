import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'
import * as fp from 'fingerpose'

// Types
interface HandPrediction {
  landmarks: number[][]
  boundingBox: {
    topLeft: [number, number]
    bottomRight: [number, number]
  }
}

interface GestureConfig {
  name: string
  displayName: string
  emoji: string
  confidenceThreshold: number
}

// Configuration
const GESTURE_CONFIGS: Record<string, GestureConfig> = {
  thumbs_up: {
    name: 'thumbs_up',
    displayName: 'Thumbs Up',
    emoji: '👍',
    confidenceThreshold: 9.0
  },
  victory: {
    name: 'victory',
    displayName: 'Victory',
    emoji: '✌️',
    confidenceThreshold: 9.0
  },
  thumbs_down: {
    name: 'thumbs_down',
    displayName: 'Thumbs Down',
    emoji: '👎',
    confidenceThreshold: 9.0
  }
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index finger
  [0, 9], [9, 10], [10, 11], [11, 12], // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17] // palm connections
]

const HandGestureRecognition: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<any>(null)
  const [gestureEstimator, setGestureEstimator] = useState<any>(null)
  const [status, setStatus] = useState<string>('Loading models...')
  const [currentGesture, setCurrentGesture] = useState<string>('Show your hand to detect gestures!')
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const animationFrameRef = useRef<number>()

  // Create thumbs down gesture
  const createThumbsDownGesture = useCallback(() => {
    const thumbsDownGesture = new fp.GestureDescription('thumbs_down')
    
    // Thumb pointing down
    thumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl)
    thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0)
    
    // Other fingers curled
    for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
      thumbsDownGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0)
      thumbsDownGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9)
    }
    
    return thumbsDownGesture
  }, [])

  // Initialize webcam
  const initWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing webcam:', error)
      setStatus('Error: Could not access webcam')
    }
  }, [])

  // Initialize models
  const initModels = useCallback(async () => {
    try {
      setStatus('Loading TensorFlow.js...')
      await tf.ready()
      
      setStatus('Loading handpose model...')
      const handposeModel = await handpose.load()
      setModel(handposeModel)
      
      setStatus('Setting up gesture recognition...')
      const knownGestures = [
        fp.Gestures.VictoryGesture,
        fp.Gestures.ThumbsUpGesture,
        createThumbsDownGesture()
      ]
      const GE = new fp.GestureEstimator(knownGestures)
      setGestureEstimator(GE)
      
      setStatus('Ready! Show your hand to detect gestures.')
      
    } catch (error) {
      console.error('Error loading models:', error)
      setStatus('Error: Failed to load models')
    }
  }, [createThumbsDownGesture])

  // Draw hand landmarks
  const drawHandLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: number[][]) => {
    // Draw connections
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx]
      const endPoint = landmarks[endIdx]
      
      if (startPoint && endPoint) {
        ctx.moveTo(startPoint[0], startPoint[1])
        ctx.lineTo(endPoint[0], endPoint[1])
      }
    })
    
    ctx.stroke()
    
    // Draw landmark points
    ctx.fillStyle = '#ff0000'
    landmarks.forEach((landmark) => {
      ctx.beginPath()
      ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [])

  // Detection loop
  const detectGestures = useCallback(async () => {
    if (!model || !gestureEstimator || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Detect hands
      const predictions: HandPrediction[] = await model.estimateHands(video)

      if (predictions.length > 0) {
        const prediction = predictions[0]
        
        // Draw hand landmarks
        if (prediction.landmarks) {
          drawHandLandmarks(ctx, prediction.landmarks)
        }

        // Detect gestures
        const gestureResult = gestureEstimator.estimate(prediction.landmarks, 9)
        
        if (gestureResult.gestures.length > 0) {
          const bestGesture = gestureResult.gestures.reduce((prev: any, current: any) => 
            prev.score > current.score ? prev : current
          )

          if (bestGesture.score > 9.0) {
            const config = GESTURE_CONFIGS[bestGesture.name]
            if (config) {
              setCurrentGesture(`${config.emoji} ${config.displayName}`)
            } else {
              setCurrentGesture(bestGesture.name)
            }
          } else {
            setCurrentGesture('Hand detected - make a gesture!')
          }
        } else {
          setCurrentGesture('Hand detected - make a gesture!')
        }
      } else {
        setCurrentGesture('Show your hand to detect gestures!')
      }
    } catch (error) {
      console.error('Detection error:', error)
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectGestures)
    }
  }, [model, gestureEstimator, isDetecting, drawHandLandmarks])

  // Start detection
  const startDetection = useCallback(() => {
    if (model && gestureEstimator && !isDetecting) {
      setIsDetecting(true)
    }
  }, [model, gestureEstimator, isDetecting])

  // Stop detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Initialize everything
  useEffect(() => {
    initModels()
    initWebcam()
    
    return () => {
      stopDetection()
    }
  }, [initModels, initWebcam, stopDetection])

  // Start detection when models are ready
  useEffect(() => {
    if (model && gestureEstimator) {
      startDetection()
    }
  }, [model, gestureEstimator, startDetection])

  // Run detection loop
  useEffect(() => {
    if (isDetecting) {
      detectGestures()
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDetecting, detectGestures])

  return (
    <div className="hand-gesture-app">
      <div className="container">
        <h1>👋 Hand Gesture Recognition</h1>
        <p className="subtitle">Real-time gesture detection using React, TypeScript & TensorFlow.js</p>
        
        <div className="video-container">
          <video 
            ref={videoRef}
            className="webcam"
            autoPlay
            muted
            playsInline
          />
          <canvas 
            ref={canvasRef}
            className="overlay-canvas"
          />
        </div>
        
        <div className="status-container">
          <div className={`status ${status.includes('Error') ? 'error' : status.includes('Ready') ? 'ready' : 'loading'}`}>
            {status}
          </div>
        </div>
        
        <div className="gesture-display">
          <div className="gesture-text">{currentGesture}</div>
        </div>
        
        <div className="instructions">
          <h3>🎯 Supported Gestures:</h3>
          <ul>
            <li><strong>👍 Thumbs Up:</strong> Point your thumb upward with other fingers curled</li>
            <li><strong>✌️ Victory:</strong> Extend index and middle fingers in a V-shape</li>
            <li><strong>👎 Thumbs Down:</strong> Point your thumb downward with other fingers curled</li>
          </ul>
        </div>
        
        <div className="footer">
          <p>Built with React, TypeScript, TensorFlow.js & Fingerpose</p>
        </div>
      </div>
    </div>
  )
}

export default HandGestureRecognition 
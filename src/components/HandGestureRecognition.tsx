import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'

// Types
interface HandPrediction {
  landmarks: number[][]
  boundingBox: {
    topLeft: [number, number]
    bottomRight: [number, number]
  }
}

interface Point {
  x: number
  y: number
}

const HandGestureRecognition: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<any>(null)
  const [status, setStatus] = useState<string>('Loading models...')
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [drawingPath, setDrawingPath] = useState<Point[]>([])
  const animationFrameRef = useRef<number>()

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
      
      setStatus('Ready! Point with your index finger to draw!')
      
    } catch (error) {
      console.error('Error loading models:', error)
      setStatus('Error: Failed to load models')
    }
  }, [])

  // Draw the finger tracking path
  const drawFingerPath = useCallback((ctx: CanvasRenderingContext2D, path: Point[]) => {
    if (path.length < 2) return

    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    // Draw the path
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    ctx.stroke()

    // Draw dots at each point for better visibility
    ctx.fillStyle = '#ff6b6b'
    path.forEach(point => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [])

  // Clear the drawing path
  const clearDrawing = useCallback(() => {
    setDrawingPath([])
  }, [])

  // Detection loop
  const detectGestures = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current) {
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
        
        // Track index finger for drawing
        if (prediction.landmarks && prediction.landmarks[8]) {
          const indexFingerTip = prediction.landmarks[8]
          const currentPos: Point = { x: indexFingerTip[0], y: indexFingerTip[1] }

          // Add to drawing path
          setDrawingPath(prev => {
            const lastPoint = prev[prev.length - 1]
            if (!lastPoint) {
              return [currentPos]
            }
            
            // Calculate distance from last position
            const distance = Math.sqrt(
              Math.pow(currentPos.x - lastPoint.x, 2) + 
              Math.pow(currentPos.y - lastPoint.y, 2)
            )

            // Only add point if finger moved enough (reduces noise)
            if (distance > 3) {
              return [...prev, currentPos]
            }
            return prev
          })

          // Draw index finger tip highlight
          ctx.strokeStyle = '#00ff00'
          ctx.fillStyle = '#00ff00'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(indexFingerTip[0], indexFingerTip[1], 8, 0, 2 * Math.PI)
          ctx.stroke()
          ctx.fill()
        }
      }

      // Always draw the existing path
      if (drawingPath.length > 0) {
        drawFingerPath(ctx, drawingPath)
      }

    } catch (error) {
      console.error('Detection error:', error)
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectGestures)
    }
  }, [model, isDetecting, drawFingerPath, drawingPath])

  // Start detection
  const startDetection = useCallback(() => {
    if (model && !isDetecting) {
      setIsDetecting(true)
    }
  }, [model, isDetecting])

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
    if (model) {
      startDetection()
    }
  }, [model, startDetection])

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
        <h1>👆 Index Finger Tracker</h1>
        <p className="subtitle">Draw with your index finger using hand tracking</p>
        
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
        
        <div className="controls">
          <button 
            onClick={clearDrawing}
            className="control-btn clear-btn"
            disabled={drawingPath.length === 0}
          >
            🗑️ Clear Drawing ({drawingPath.length} points)
          </button>
        </div>
        
        <div className="instructions">
          <h3>🎯 How to Use:</h3>
          <ul>
            <li><strong>👆 Point:</strong> Extend your index finger and move it around to draw</li>
            <li><strong>🎨 Draw:</strong> The red line follows wherever your index finger tip goes</li>
            <li><strong>🟢 Green dot:</strong> Shows your current index finger position</li>
            <li><strong>🗑️ Clear:</strong> Use the button to erase your drawing</li>
          </ul>
        </div>
        
        <div className="footer">
          <p>Built with React, TypeScript & TensorFlow.js HandPose</p>
        </div>
      </div>
    </div>
  )
}

export default HandGestureRecognition 
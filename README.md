# 👋 Hand Gesture Recognition - React App

A real-time hand gesture recognition application built with **React**, **TypeScript**, **TensorFlow.js**, and **Fingerpose**. This demo detects hand gestures through your webcam and provides visual feedback with high accuracy using modern web technologies.

## ✨ Features

- **React Application**: Modern React 18 with TypeScript and functional components
- **Real-time Hand Detection**: 21-point hand landmark detection using TensorFlow.js
- **Custom Gesture Recognition**: Built-in support for thumbs up, victory sign, and thumbs down
- **TypeScript Implementation**: Fully typed codebase with strict type checking
- **Modern UI**: Responsive design with smooth animations and visual feedback
- **Vite Build System**: Fast development server and optimized production builds
- **Single Bundle**: Everything compiled into optimized chunks for fast loading

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **Modern web browser** with webcam support
- **HTTPS or localhost** (required for webcam access)

### Installation

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

5. **Allow webcam access** when prompted

## 📁 Project Structure

```
hand-gesture-recognition-react/
├── src/                           # React source files
│   ├── components/               # React components
│   │   └── HandGestureRecognition.tsx  # Main gesture recognition component
│   ├── types/                    # TypeScript type declarations
│   │   └── fingerpose.d.ts      # Fingerpose library types
│   ├── App.tsx                   # Main App component
│   ├── App.css                   # App-specific styles
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
├── dist/                         # Production build output
├── index.html                    # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # Node.js TypeScript configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🎯 Supported Gestures

| Gesture | Description | Emoji |
|---------|-------------|-------|
| **Thumbs Up** | Point thumb upward, curl other fingers | 👍 |
| **Victory** | Extend index and middle fingers in V-shape | ✌️ |
| **Thumbs Down** | Point thumb downward, curl other fingers | 👎 |

## 🛠 Development

### Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm start` - Build and preview production version

### Development Workflow

```bash
# Start development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding Custom Gestures

1. **Create gesture in the component**:
   ```typescript
   const createCustomGesture = useCallback(() => {
     const customGesture = new fp.GestureDescription('custom_name')
     // Configure finger positions and directions
     customGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl)
     customGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0)
     return customGesture
   }, [])
   ```

2. **Add to known gestures array**:
   ```typescript
   const knownGestures = [
     fp.Gestures.VictoryGesture,
     fp.Gestures.ThumbsUpGesture,
     createThumbsDownGesture(),
     createCustomGesture() // Add your gesture
   ]
   ```

3. **Update gesture configuration**:
   ```typescript
   const GESTURE_CONFIGS: Record<string, GestureConfig> = {
     custom_name: {
       name: 'custom_name',
       displayName: 'Custom Gesture',
       emoji: '🤟',
       confidenceThreshold: 9.0
     }
   }
   ```

## 🔧 Configuration

### Vite Configuration

The application uses Vite for:
- **Fast Development**: Hot module replacement (HMR)
- **Optimized Builds**: Code splitting and tree shaking
- **TypeScript Support**: Built-in TypeScript compilation
- **Modern JavaScript**: ES modules and modern browser features

### TypeScript Configuration

- **Strict Mode**: Enabled for better type safety
- **React JSX**: New JSX transform (no need to import React)
- **Module Resolution**: Bundler mode for Vite compatibility
- **Source Maps**: Enabled for debugging

## 🌐 Build Output

The production build creates optimized chunks:
- **Vendor chunk**: React and React DOM
- **TensorFlow chunk**: TensorFlow.js and handpose model
- **Gestures chunk**: Fingerpose library
- **Main chunk**: Application code

## 🔍 Troubleshooting

### Common Issues

1. **Webcam not working**:
   - Ensure you're using HTTPS or localhost
   - Check browser permissions for camera access
   - Try refreshing the page

2. **Models not loading**:
   - Check internet connection for CDN resources
   - Verify TensorFlow.js compatibility
   - Clear browser cache

3. **Build errors**:
   - Run `npm run build` to check TypeScript compilation
   - Ensure all dependencies are installed
   - Check for TypeScript version compatibility

4. **Performance issues**:
   - TensorFlow.js models are large (~2MB)
   - First load may take longer
   - Consider implementing loading states

### Browser Compatibility

- **Chrome** 88+ ✅
- **Firefox** 85+ ✅
- **Safari** 14+ ✅
- **Edge** 88+ ✅

## 📚 Technical Details

### React Architecture

- **Functional Components**: Using React hooks for state management
- **useCallback**: Optimized function memoization
- **useEffect**: Lifecycle management and cleanup
- **useRef**: Direct DOM access for video and canvas
- **TypeScript**: Full type safety throughout

### Performance Optimizations

- **Code Splitting**: Automatic chunking by Vite
- **Tree Shaking**: Unused code elimination
- **Modern JavaScript**: ES2020 target
- **WebGL Acceleration**: Hardware-accelerated TensorFlow.js

### Bundle Analysis

```bash
# Analyze bundle size
npm run build

# The build output shows chunk sizes:
# - tensorflow chunk: ~2.1MB (TensorFlow.js)
# - vendor chunk: ~141KB (React)
# - gestures chunk: ~14KB (Fingerpose)
# - main chunk: ~6KB (App code)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test in development mode
5. Build for production to verify
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent framework
- **Vite Team** for the amazing build tool
- **TensorFlow.js** team for the handpose model
- **Fingerpose** library for gesture recognition
- **TypeScript** for type safety and better development experience

## 🔗 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TensorFlow.js Handpose Model](https://github.com/tensorflow/tfjs-models/tree/master/handpose)
- [Fingerpose Library](https://github.com/andypotato/fingerpose)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ using React, TypeScript, TensorFlow.js, and modern web technologies** 
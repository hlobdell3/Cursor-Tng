# Gesture-Based Spell Casting Game

A multiplayer web-based game where players cast spells using hand gestures captured via webcam. Players compete in an arena, casting offensive spells while defending with shields and status effects.

## Features

- **Gesture Recognition**: Uses TensorFlow.js and MediaPipe for real-time hand tracking and gesture recognition
- **Spell System**: Cast spells from different disciplines (Fire, Water, Air, Earth, Lightning, Shadow)
- **Multiplayer**: Real-time gameplay with 2-4 players
- **Tutorial System**: Learn spells through interactive demonstrations and practice
- **Dynamic Arena**: Players move in their zones with strategic positions for area-of-effect spells
- **Health System**: Player strength decreases as health is lost, affecting casting speed
- **Visual Effects**: See spells being cast and their effects on targets

## Technology Stack

- **Frontend**: React with TypeScript
- **Hand Tracking**: TensorFlow.js and MediaPipe Hands
- **Real-time Communication**: WebRTC for video, WebSockets for game state
- **Graphics**: Canvas/WebGL for spell effects and arena visualization

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn or pnpm

### Installation

1. Clone this repository
2. Install dependencies using one of the following commands:

```bash
# Using npm
npm install

# Using yarn
yarn

# Using pnpm
pnpm install
```

### Running the Application

Start the development server:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

The application should open in your browser at `http://localhost:5173`.

## Usage

1. Allow camera access when prompted
2. Follow the animation guides to perform motion gestures:
   - Fire: Make a clockwise circular motion with your hand
   - Air: Move your hand up and down vertically
   - Earth: Move your hand left and right horizontally
   - Water: Wave your hand side to side multiple times
   - Lightning: Push your hand toward the camera

The application will display the detected gesture and confidence percentage in a popup on the screen.

## Troubleshooting

- **Camera access denied:** Make sure you've granted camera permissions to your browser
- **Low detection accuracy:** Ensure you're in a well-lit environment and your hand is clearly visible
- **Performance issues:** Close other resource-intensive applications

## Important Note About Installation

If you're having issues running the application with npm, you can try using a Node version manager:

- [nvm](https://github.com/nvm-sh/nvm) (for Mac/Linux)
- [nvm-windows](https://github.com/coreybutler/nvm-windows) (for Windows)

Or try using an alternative package manager like yarn or pnpm:

```bash
# Install yarn
npm install -g yarn

# Install pnpm
npm install -g pnpm
```

## Game Mechanics

### Spell Types

- **Attack Spells**: Deal damage to opponents
- **Defense Spells**: Shield from attacks with varying effectiveness
- **Status Spells**: Apply effects like blindness, slowing, or teleportation

### Disciplines

Each discipline has unique characteristics and a shared base gesture:

- **Fire**: High damage, longer casting time
- **Water**: Moderate effects, good casting speed
- **Air**: Quick to cast, mobility effects
- **Earth**: Strong defensive capabilities
- **Lightning**: High damage, moderate casting time
- **Shadow**: Status effects and disruption

### Gesture Recognition

Spells are cast through a sequence of hand gestures:
1. Discipline-specific gesture (common to all spells of that discipline)
2. Spell-specific gesture

The accuracy of gesture execution affects spell power.

### Health and Stamina

- Players start with 500 health points
- Losing health impacts casting speed
- When health reaches 0, the player is eliminated

## Tutorial System

The tutorial teaches players:
- Available spells and their effects
- How to perform gesture sequences
- Visual cues for identifying spells
- Practice mode with feedback on accuracy

## Development

### Project Structure

```
src/
  ├── components/         # React components
  ├── services/           # Core services like gesture recognition
  ├── types/              # TypeScript type definitions
  ├── data/               # Game data like spells
  ├── utils/              # Utility functions
  └── App.tsx             # Main application component
```

### Key Components

- `GestureRecognitionService`: Core service for hand tracking and gesture matching
- `SpellCasting`: Component for detecting and visualizing spell casting
- `SpellTutorial`: Interactive tutorial system
- `Arena`: Game arena with player zones and movement

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow.js team for the hand pose detection models
- MediaPipe team for the hand tracking solutions 
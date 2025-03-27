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

- Node.js (v14 or higher)
- Modern web browser with webcam access
- Good internet connection for multiplayer

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/spell-casting-game.git
   cd spell-casting-game
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

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
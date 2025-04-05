import React from 'react';

interface GestureGuideProps {
  onClose: () => void;
}

const GestureGuide: React.FC<GestureGuideProps> = ({ onClose }) => {
  const gestures = [
    {
      name: 'Fire',
      description: 'Make a clockwise circular motion with your hand',
      motionPattern: 'CIRCLE_CLOCKWISE',
      tips: [
        'Start with your hand in a neutral position',
        'Move your hand in a smooth, clockwise circle',
        'Keep the circle size consistent',
        'Complete at least one full rotation'
      ]
    },
    {
      name: 'Air',
      description: 'Make a quick clapping motion with both hands',
      motionPattern: 'TWO_HAND_CLAP',
      tips: [
        'Hold both hands up in front of you',
        'Bring your hands together quickly',
        'Make sure both hands are clearly visible',
        'The motion should be quick and decisive'
      ]
    },
    {
      name: 'Earth',
      description: 'Draw a V shape in the air',
      motionPattern: 'V_SHAPE',
      tips: [
        'Start with your hand in a neutral position',
        'Move your hand up and to the right',
        'Then move down and to the left',
        'The V should be clear and distinct'
      ]
    },
    {
      name: 'Water',
      description: 'Draw a W shape in the air',
      motionPattern: 'W_SHAPE',
      tips: [
        'Start with your hand in a neutral position',
        'Move your hand up and down in a W pattern',
        'Make each part of the W distinct',
        'Keep the motion smooth and fluid'
      ]
    },
    {
      name: 'Lightning',
      description: 'Draw a zigzag pattern in the air',
      motionPattern: 'ZIGZAG',
      tips: [
        'Start with your hand in a neutral position',
        'Move your hand in a quick zigzag pattern',
        'Make the zigzag sharp and angular',
        'The motion should be quick and decisive'
      ]
    }
  ];

  return (
    <div className="gesture-guide">
      <h2>Gesture Guide</h2>
      <div className="gesture-list">
        {gestures.map((gesture, index) => (
          <div key={index} className="gesture-item">
            <h3>{gesture.name}</h3>
            <p>{gesture.description}</p>
            <p><strong>Motion Pattern:</strong> {gesture.motionPattern}</p>
            <ul>
              {gesture.tips.map((tip, tipIndex) => (
                <li key={tipIndex}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close Guide</button>
      <style jsx>{`
        .gesture-guide {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1000;
        }

        h2 {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }

        .gesture-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gesture-item {
          background: #f8f8f8;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        .gesture-item h3 {
          margin: 0 0 10px 0;
          color: #444;
        }

        .gesture-item p {
          margin: 5px 0;
          color: #666;
        }

        .gesture-item ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .gesture-item li {
          margin: 5px 0;
          color: #666;
        }

        button {
          display: block;
          margin: 20px auto 0;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        button:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default GestureGuide; 
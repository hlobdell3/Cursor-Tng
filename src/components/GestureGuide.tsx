import React from 'react';
import { SpellDiscipline } from '../types/gesture';

const GestureGuide: React.FC = () => {
  return (
    <div className="gesture-guide-container">
      <h2>Ideal Gesture Positions</h2>
      <p>Use these reference images to perfect your spell casting gestures</p>
      
      <div className="gesture-grid">
        {/* Fire Gesture - Open Palm */}
        <div className="gesture-card">
          <h3>Fire Gesture - Open Palm</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline */}
              <path d="M70,180 C40,160 30,130 30,100 C30,85 35,75 50,65 C55,60 60,40 65,30 C70,20 75,20 80,30 C83,37 85,55 86,65 M86,65 C88,55 92,35 96,25 C100,15 105,15 108,25 C110,32 112,55 113,65 M113,65 C115,55 118,35 122,25 C126,15 131,15 134,25 C136,32 138,55 139,65 M139,65 C141,55 144,35 148,25 C152,15 157,15 160,25 C162,32 164,55 165,65 M165,65 C167,60 170,45 174,35 C178,25 184,28 185,35 C186,42 185,60 183,70 C180,85 175,100 170,110 C155,135 130,160 100,180 C90,180 80,180 70,180" 
                fill="none" stroke="#333" strokeWidth="3" />
              {/* Finger joints */}
              <circle cx="80" cy="30" r="4" fill="#ff5555" />
              <circle cx="80" cy="65" r="4" fill="#ff5555" />
              <circle cx="96" cy="25" r="4" fill="#ff5555" />
              <circle cx="96" cy="65" r="4" fill="#ff5555" />
              <circle cx="122" cy="25" r="4" fill="#ff5555" />
              <circle cx="122" cy="65" r="4" fill="#ff5555" />
              <circle cx="148" cy="25" r="4" fill="#ff5555" />
              <circle cx="148" cy="65" r="4" fill="#ff5555" />
              <circle cx="174" cy="35" r="4" fill="#ff5555" />
              <circle cx="174" cy="70" r="4" fill="#ff5555" />
              <text x="100" y="150" textAnchor="middle" fill="#333" fontSize="12">All fingers extended</text>
            </svg>
          </div>
          <div className="discipline">{SpellDiscipline.FIRE}</div>
        </div>
        
        {/* Air Gesture - Pointing */}
        <div className="gesture-card">
          <h3>Air Gesture - Pointing</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline with only index extended */}
              <path d="M70,180 C40,160 30,130 30,100 C30,85 35,75 50,65 C55,60 60,50 65,45 C70,40 75,40 77,45 C78,48 78,60 78,65 M96,65 C96,55 96,35 96,25 C96,15 100,10 105,15 C108,18 112,55 113,65 M113,90 C115,90 118,90 122,90 C126,90 131,90 134,90 C136,90 138,90 139,90 M139,90 C141,90 144,90 148,90 C152,90 157,90 160,90 C162,90 164,90 165,90 M165,90 C167,90 170,90 174,90 C178,90 184,90 185,90 C186,90 185,90 183,90 C180,90 175,100 170,110 C155,135 130,160 100,180 C90,180 80,180 70,180"
                fill="none" stroke="#333" strokeWidth="3" />
              {/* Finger joints */}
              <circle cx="77" cy="45" r="4" fill="#ff5555" />
              <circle cx="78" cy="65" r="4" fill="#ff5555" />
              <circle cx="96" cy="25" r="4" fill="#ff5555" />
              <circle cx="110" cy="65" r="4" fill="#ff5555" />
              <circle cx="122" cy="90" r="4" fill="#ff5555" />
              <circle cx="148" cy="90" r="4" fill="#ff5555" />
              <circle cx="174" cy="90" r="4" fill="#ff5555" />
              <text x="100" y="150" textAnchor="middle" fill="#333" fontSize="12">Only index finger extended</text>
            </svg>
          </div>
          <div className="discipline">{SpellDiscipline.AIR}</div>
        </div>
        
        {/* Earth Gesture - Closed Fist */}
        <div className="gesture-card">
          <h3>Earth Gesture - Closed Fist</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline as closed fist */}
              <path d="M70,180 C40,160 30,130 30,100 C30,85 35,75 50,65 C55,60 60,70 65,80 C70,90 75,90 80,85 C83,80 85,75 86,70 M86,70 C88,75 92,85 96,90 C100,95 105,95 108,90 C110,85 112,75 113,70 M113,70 C115,75 118,85 122,90 C126,95 131,95 134,90 C136,85 138,75 139,70 M139,70 C141,75 144,85 148,90 C152,95 157,95 160,90 C162,85 164,75 165,70 M165,70 C167,75 170,85 174,90 C178,95 184,92 185,85 C186,78 185,70 183,70 C180,85 175,100 170,110 C155,135 130,160 100,180 C90,180 80,180 70,180"
                fill="none" stroke="#333" strokeWidth="3" />
              {/* Finger joints - all curled */}
              <circle cx="80" cy="85" r="4" fill="#ff5555" />
              <circle cx="96" cy="90" r="4" fill="#ff5555" />
              <circle cx="122" cy="90" r="4" fill="#ff5555" />
              <circle cx="148" cy="90" r="4" fill="#ff5555" />
              <circle cx="174" cy="90" r="4" fill="#ff5555" />
              <text x="100" y="150" textAnchor="middle" fill="#333" fontSize="12">All fingers curled into a fist</text>
            </svg>
          </div>
          <div className="discipline">{SpellDiscipline.EARTH}</div>
        </div>
        
        {/* Water Gesture - Victory Sign */}
        <div className="gesture-card">
          <h3>Water Gesture - Victory Sign</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline with index and middle extended */}
              <path d="M70,180 C40,160 30,130 30,100 C30,85 35,75 50,65 C55,60 60,50 65,45 C70,40 75,40 77,45 C78,48 78,60 78,65 M78,65 C88,55 92,35 96,25 C96,15 100,10 105,15 C108,18 112,55 113,65 M113,65 C115,55 118,35 122,25 C122,15 128,10 132,15 C134,18 138,55 139,65 M139,90 C141,90 144,90 148,90 C152,90 157,90 160,90 C162,90 164,90 165,90 M165,90 C167,90 170,90 174,90 C178,90 184,90 185,90 C186,90 185,90 183,90 C180,90 175,100 170,110 C155,135 130,160 100,180 C90,180 80,180 70,180"
                fill="none" stroke="#333" strokeWidth="3" />
              {/* Finger joints */}
              <circle cx="77" cy="45" r="4" fill="#ff5555" />
              <circle cx="78" cy="65" r="4" fill="#ff5555" />
              <circle cx="96" cy="25" r="4" fill="#ff5555" />
              <circle cx="110" cy="65" r="4" fill="#ff5555" />
              <circle cx="122" cy="25" r="4" fill="#ff5555" />
              <circle cx="134" cy="65" r="4" fill="#ff5555" />
              <circle cx="148" cy="90" r="4" fill="#ff5555" />
              <circle cx="174" cy="90" r="4" fill="#ff5555" />
              <text x="100" y="150" textAnchor="middle" fill="#333" fontSize="12">Index and middle fingers extended</text>
            </svg>
          </div>
          <div className="discipline">{SpellDiscipline.WATER}</div>
        </div>
        
        {/* Lightning Gesture - Rock On */}
        <div className="gesture-card">
          <h3>Lightning Gesture - Rock On</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline with index and pinky extended */}
              <path d="M70,180 C40,160 30,130 30,100 C30,85 35,75 50,65 C55,60 60,50 65,45 C70,40 75,40 77,45 C78,48 78,60 78,65 M78,65 C88,55 92,35 96,25 C96,15 100,10 105,15 C108,18 112,55 113,65 M113,90 C115,90 118,90 122,90 C126,90 131,90 134,90 C136,90 138,90 139,90 M139,90 C141,90 144,90 148,90 C152,90 157,90 160,90 C162,90 164,90 165,90 M165,65 C167,55 170,35 174,25 C178,15 184,15 185,25 C186,32 185,60 183,70 C180,85 175,100 170,110 C155,135 130,160 100,180 C90,180 80,180 70,180"
                fill="none" stroke="#333" strokeWidth="3" />
              {/* Finger joints */}
              <circle cx="77" cy="45" r="4" fill="#ff5555" />
              <circle cx="78" cy="65" r="4" fill="#ff5555" />
              <circle cx="96" cy="25" r="4" fill="#ff5555" />
              <circle cx="110" cy="65" r="4" fill="#ff5555" />
              <circle cx="122" cy="90" r="4" fill="#ff5555" />
              <circle cx="148" cy="90" r="4" fill="#ff5555" />
              <circle cx="174" cy="25" r="4" fill="#ff5555" />
              <circle cx="183" cy="70" r="4" fill="#ff5555" />
              <text x="100" y="150" textAnchor="middle" fill="#333" fontSize="12">Index and pinky fingers extended</text>
            </svg>
          </div>
          <div className="discipline">{SpellDiscipline.LIGHTNING}</div>
        </div>
      </div>
      
      <style jsx>{`
        .gesture-guide-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 10px;
        }
        
        p {
          text-align: center;
          margin-bottom: 30px;
          color: #666;
        }
        
        .gesture-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .gesture-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        
        .gesture-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
          text-align: center;
        }
        
        .gesture-svg-container {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 15px;
          display: flex;
          justify-content: center;
        }
        
        .discipline {
          background: #e0f0ff;
          color: #0066cc;
          font-weight: bold;
          text-align: center;
          padding: 8px;
          border-radius: 4px;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
};

export default GestureGuide; 
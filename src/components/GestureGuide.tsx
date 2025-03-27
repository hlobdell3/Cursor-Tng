import React from 'react';
import { SpellDiscipline, MotionPattern } from '../types/gesture';

const GestureGuide: React.FC = () => {
  return (
    <div className="gesture-guide-container">
      <h2>Spell Casting Motion Gestures</h2>
      <p>Use these motion patterns to cast spells with your hands</p>
      
      <div className="gesture-grid">
        {/* Fire - Clockwise Circle */}
        <div className="gesture-card">
          <h3>Fire - Clockwise Circle</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Hand outline */}
              <circle cx="100" cy="100" r="60" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M100,40 A60,60 0 1,1 99,40" fill="none" stroke="#FF5555" strokeWidth="3" />
              
              {/* Motion arrows */}
              <path d="M140,70 L150,60 L152,75" fill="none" stroke="#FF5555" strokeWidth="2" />
              <path d="M70,150 L60,160 L45,158" fill="none" stroke="#FF5555" strokeWidth="2" />
              
              {/* Hand symbol */}
              <g transform="translate(145, 110) scale(0.5)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#FFDDDD" stroke="#FF5555" strokeWidth="2" />
              </g>
              
              <text x="100" y="190" textAnchor="middle" fill="#333" fontWeight="bold" fontSize="12">RIGHT HAND - Clockwise Circle</text>
            </svg>
          </div>
          <div className="description">
            <p>Draw a clockwise circle with your right hand</p>
            <p>Keep fingers extended in an open palm position</p>
          </div>
          <div className="discipline">{SpellDiscipline.FIRE}</div>
        </div>
        
        {/* Air - Vertical Motion */}
        <div className="gesture-card">
          <h3>Air - Vertical Motion</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Vertical path */}
              <line x1="100" y1="40" x2="100" y2="160" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M100,40 L100,160 L100,40" fill="none" stroke="#77AAFF" strokeWidth="3" />
              
              {/* Motion arrows */}
              <path d="M100,40 L95,50 L105,50" fill="none" stroke="#77AAFF" strokeWidth="2" />
              <path d="M100,160 L95,150 L105,150" fill="none" stroke="#77AAFF" strokeWidth="2" />
              
              {/* Hand symbol */}
              <g transform="translate(120, 70) scale(0.4) rotate(90)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#DDEEFF" stroke="#77AAFF" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="40" stroke="#77AAFF" strokeWidth="3" /> 
              </g>
              
              <g transform="translate(120, 130) scale(0.4) rotate(90)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#DDEEFF" stroke="#77AAFF" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="40" stroke="#77AAFF" strokeWidth="3" /> 
              </g>
              
              <text x="100" y="190" textAnchor="middle" fill="#333" fontWeight="bold" fontSize="12">ANY HAND - Up and Down</text>
            </svg>
          </div>
          <div className="description">
            <p>Move your hand up and down in a straight line</p>
            <p>Extend your index finger for best results</p>
          </div>
          <div className="discipline">{SpellDiscipline.AIR}</div>
        </div>
        
        {/* Earth - Horizontal Motion */}
        <div className="gesture-card">
          <h3>Earth - Horizontal Motion</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Horizontal path */}
              <line x1="40" y1="100" x2="160" y2="100" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M40,100 L160,100 L40,100" fill="none" stroke="#A07040" strokeWidth="3" />
              
              {/* Motion arrows */}
              <path d="M40,100 L50,95 L50,105" fill="none" stroke="#A07040" strokeWidth="2" />
              <path d="M160,100 L150,95 L150,105" fill="none" stroke="#A07040" strokeWidth="2" />
              
              {/* Fist symbols */}
              <g transform="translate(60, 120) scale(0.4)">
                <path d="M20,10 C15,10 10,15 10,25 C10,35 10,40 20,45 C30,50 60,50 70,45 C80,40 80,35 80,25 C80,15 75,10 70,10 C67,18 63,18 60,10 C57,18 53,18 50,10 C47,18 43,18 40,10 C37,18 33,18 30,10 C25,10 20,10 20,10" fill="#DDCCBB" stroke="#A07040" strokeWidth="2" />
              </g>
              
              <g transform="translate(120, 120) scale(0.4)">
                <path d="M20,10 C15,10 10,15 10,25 C10,35 10,40 20,45 C30,50 60,50 70,45 C80,40 80,35 80,25 C80,15 75,10 70,10 C67,18 63,18 60,10 C57,18 53,18 50,10 C47,18 43,18 40,10 C37,18 33,18 30,10 C25,10 20,10 20,10" fill="#DDCCBB" stroke="#A07040" strokeWidth="2" />
              </g>
              
              <text x="100" y="190" textAnchor="middle" fill="#333" fontWeight="bold" fontSize="12">ANY HAND - Left and Right</text>
            </svg>
          </div>
          <div className="description">
            <p>Move your hand left and right in a straight line</p>
            <p>Form a fist for best results</p>
          </div>
          <div className="discipline">{SpellDiscipline.EARTH}</div>
        </div>
        
        {/* Water - Wave Motion */}
        <div className="gesture-card">
          <h3>Water - Wave Motion</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Wave path */}
              <path d="M40,100 Q60,80 80,100 Q100,120 120,100 Q140,80 160,100" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M40,100 Q60,80 80,100 Q100,120 120,100 Q140,80 160,100" fill="none" stroke="#50A0FF" strokeWidth="3" />
              
              {/* Motion arrows */}
              <path d="M60,80 L55,75 L65,70" fill="none" stroke="#50A0FF" strokeWidth="2" />
              <path d="M140,80 L135,75 L145,70" fill="none" stroke="#50A0FF" strokeWidth="2" />
              
              {/* Hand symbol with V sign */}
              <g transform="translate(80, 120) scale(0.4) rotate(-20)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#D0E8FF" stroke="#50A0FF" strokeWidth="2" />
                <line x1="30" y1="10" x2="30" y2="30" stroke="#50A0FF" strokeWidth="3" /> 
                <line x1="50" y1="10" x2="50" y2="30" stroke="#50A0FF" strokeWidth="3" /> 
              </g>
              
              <g transform="translate(120, 120) scale(0.4) rotate(20)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#D0E8FF" stroke="#50A0FF" strokeWidth="2" />
                <line x1="30" y1="10" x2="30" y2="30" stroke="#50A0FF" strokeWidth="3" /> 
                <line x1="50" y1="10" x2="50" y2="30" stroke="#50A0FF" strokeWidth="3" /> 
              </g>
              
              <text x="100" y="190" textAnchor="middle" fill="#333" fontWeight="bold" fontSize="12">ANY HAND - Waving Side to Side</text>
            </svg>
          </div>
          <div className="description">
            <p>Wave your hand side to side multiple times</p>
            <p>Form a V-sign with index and middle fingers</p>
          </div>
          <div className="discipline">{SpellDiscipline.WATER}</div>
        </div>
        
        {/* Lightning - Forward Thrust */}
        <div className="gesture-card">
          <h3>Lightning - Forward Thrust</h3>
          <div className="gesture-svg-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              {/* Forward thrust path */}
              <path d="M160,100 L60,100" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M160,100 L60,100" fill="none" stroke="#FFCC00" strokeWidth="3" />
              
              {/* Motion arrows - pointing toward camera */}
              <path d="M120,100 L100,90 L100,110 Z" fill="#FFCC00" stroke="#FFCC00" strokeWidth="1" />
              
              {/* Small hand to large hand (perspective) */}
              <g transform="translate(150, 100) scale(0.3)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#FFFFDD" stroke="#FFCC00" strokeWidth="2" />
                <line x1="30" y1="10" x2="30" y2="30" stroke="#FFCC00" strokeWidth="3" /> 
                <line x1="70" y1="10" x2="70" y2="30" stroke="#FFCC00" strokeWidth="3" /> 
              </g>
              
              <g transform="translate(90, 100) scale(0.6)">
                <path d="M10,40 C5,30 5,20 10,10 C15,0 25,0 30,10 C35,0 45,0 50,10 C55,0 65,0 70,10 C75,0 85,0 90,10 C95,20 95,30 90,40 C70,60 30,60 10,40" fill="#FFFFDD" stroke="#FFCC00" strokeWidth="2" />
                <line x1="30" y1="10" x2="30" y2="30" stroke="#FFCC00" strokeWidth="3" /> 
                <line x1="70" y1="10" x2="70" y2="30" stroke="#FFCC00" strokeWidth="3" /> 
              </g>
              
              <text x="100" y="170" textAnchor="middle" fill="#333" fontWeight="bold" fontSize="12">ANY HAND - Thrust Toward Camera</text>
              <text x="100" y="190" textAnchor="middle" fill="#333" fontSize="10">(Push hand forward)</text>
            </svg>
          </div>
          <div className="description">
            <p>Push your hand directly toward the camera</p>
            <p>Use the rock-on hand sign with index and pinky extended</p>
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
        
        .description {
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .description p {
          margin: 5px 0;
          text-align: center;
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
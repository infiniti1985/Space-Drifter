import React from 'react';

const STAR_COUNT = 100;

const HyperspaceEffect: React.FC = () => {
  return (
    <div className="hyperspace-overlay pointer-events-none">
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className="star-stretch"
          style={{
            // @ts-ignore
            '--angle': `${Math.random() * 360}deg`,
            // Stagger animations for a more dynamic effect
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default HyperspaceEffect;

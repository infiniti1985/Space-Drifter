import React, { useMemo } from 'react';
import type { Vector2D } from '../types';

interface ParallaxBackgroundProps {
  cameraOffset: Vector2D;
  sector: number;
}

const createStars = (count: number, size: string = '1px') => {
  let stars = '';
  const areaSize = 3000;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * areaSize - areaSize / 2);
    const y = Math.floor(Math.random() * areaSize - areaSize / 2);
    stars += `${x}px ${y}px ${size} white, `;
  }
  return stars.slice(0, -2);
};

const starLayers = [
  { style: { width: '1px', height: '1px', boxShadow: createStars(500, '1px') }, speed: 0.1 },
  { style: { width: '2px', height: '2px', boxShadow: createStars(200, '2px') }, speed: 0.2 },
  { style: { width: '3px', height: '3px', boxShadow: createStars(80, '3px') }, speed: 0.3 },
];

// Fix: The function was returning objects with a 'speed' property mixed into CSS properties, causing a type error.
// The return type and object structure have been updated to separate style properties from the custom 'speed' property.
const generateNebulaStyle = (seed: number): Array<{ style: React.CSSProperties; speed: number; }> => {
    const random = (s: number) => () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
    const seededRandom = random(seed);

    const colors = [
        `hsla(${seededRandom() * 360}, 70%, 50%, 0.2)`,
        `hsla(${seededRandom() * 360}, 70%, 50%, 0.2)`,
        `hsla(${seededRandom() * 360}, 70%, 50%, 0.1)`,
    ];

    return [
        { // Large, distant cloud layer
            style: {
                width: '250vw',
                height: '250vh',
                background: `radial-gradient(ellipse at ${seededRandom()*100}%, ${seededRandom()*100}%, ${colors[0]} 0%, transparent 70%)`,
                filter: 'blur(100px)',
            },
            speed: 0.03,
        },
        { // Medium cloud layer
            style: {
                width: '200vw',
                height: '200vh',
                background: `radial-gradient(ellipse at ${seededRandom()*100}%, ${seededRandom()*100}%, ${colors[1]} 0%, transparent 60%)`,
                filter: 'blur(80px)',
            },
            speed: 0.05,
        },
        { // Closer, smaller cloud
            style: {
                width: '150vw',
                height: '150vh',
                background: `radial-gradient(ellipse at ${seededRandom()*100}%, ${seededRandom()*100}%, ${colors[2]} 0%, transparent 50%)`,
                filter: 'blur(60px)',
            },
            speed: 0.07,
        }
    ];
};

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ cameraOffset, sector }) => {
  const nebulaLayers = useMemo(() => generateNebulaStyle(sector), [sector]);

  return (
    <div className="fixed top-0 left-0 w-full h-full">
      {/* Nebula Layers */}
      {/* Fix: Changed `...layer` to `...layer.style` to correctly spread only the CSS properties into the style object. */}
      {nebulaLayers.map((layer, i) => (
        <div
          key={`nebula-${i}`}
          className="absolute top-1/2 left-1/2"
          style={{
            ...layer.style,
            transform: `translate(-50%, -50%) translate(${-cameraOffset.x * layer.speed}px, ${-cameraOffset.y * layer.speed}px)`,
            zIndex: -20 + i,
          }}
        />
      ))}

      {/* Star Layers */}
      {starLayers.map((layer, i) => (
        <div
          key={`star-${i}`}
          className="absolute top-1/2 left-1/2"
          style={{
            ...layer.style,
            transform: `translate(${-cameraOffset.x * layer.speed}px, ${-cameraOffset.y * layer.speed}px)`,
            zIndex: -10 + i,
          }}
        />
      ))}
    </div>
  );
};

export default ParallaxBackground;
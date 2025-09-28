import React from 'react';
import type { Ship, CelestialBody, Asteroid, Resource, Vector2D, HyperspaceGate } from '../types';
import { GAME_WORLD_SIZE } from '../constants';

interface RadarProps {
  ship: Ship;
  star: CelestialBody;
  planets: CelestialBody[];
  asteroids: Asteroid[];
  resources: Resource[];
  hyperspaceGate: HyperspaceGate | null;
  t: (key: string) => string;
}

const RADAR_SIZE = 200; // px

const mapWorldToRadar = (position: Vector2D): Vector2D => {
  const scale = RADAR_SIZE / GAME_WORLD_SIZE;
  return {
    x: position.x * scale,
    y: position.y * scale,
  };
};

const RadarDot: React.FC<{ pos: Vector2D; color: string; size: number; type: string; className?: string }> = ({ pos, color, size, type, className = '' }) => (
  <div
    title={type}
    className={`absolute rounded-full ${className}`}
    style={{
      left: pos.x - size / 2,
      top: pos.y - size / 2,
      width: size,
      height: size,
      backgroundColor: color,
    }}
  />
);

const Radar: React.FC<RadarProps> = ({ ship, star, planets, asteroids, resources, hyperspaceGate, t }) => {
  const allObjects: Array<{obj: any, color: string, size: number, type: string, className?: string}> = [
    { obj: ship, color: '#00ff00', size: 6, type: t('radarTypeYou') },
    { obj: star, color: '#ffdf00', size: 10, type: t('radarTypeStar') },
    ...planets.map(p => ({ obj: p, color: '#60a5fa', size: 6, type: t('radarTypePlanet') })),
    ...asteroids.map(a => ({ obj: a, color: '#9ca3af', size: 2, type: t('radarTypeAsteroid') })),
    ...resources.map(r => ({ obj: r, color: '#22d3ee', size: 3, type: t('radarTypeCrystal') })),
  ];

  if (hyperspaceGate) {
    allObjects.push({ obj: hyperspaceGate, color: '#00ffff', size: 8, type: t('radarTypeGate'), className: 'radar-gate-dot' });
  }

  return (
    <div 
        className="font-mono-retro fixed bottom-4 left-4 border-2 border-slate-600 bg-black bg-opacity-50 p-2 z-50"
        style={{ width: RADAR_SIZE + 16, height: RADAR_SIZE + 40 }}
        aria-label={t('radarTitle')}
    >
      <p className="text-center text-orange-400 text-sm uppercase tracking-widest mb-1" aria-hidden="true">{t('radarTitle')}</p>
      <div className="relative overflow-hidden border border-slate-700" style={{ width: RADAR_SIZE, height: RADAR_SIZE }}>
        {allObjects.map(item => {
          if (!item.obj) return null;
          const radarPos = mapWorldToRadar(item.obj.position);
          return (
            <RadarDot
              key={item.obj.id}
              pos={radarPos}
              color={item.color}
              size={item.size}
              type={item.type}
              className={item.className}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Radar;
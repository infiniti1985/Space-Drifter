

import type { CelestialBody, Asteroid, Vector2D, RangerStation, HyperspaceGate } from '../types';
import { GAME_WORLD_SIZE, GRAVITATIONAL_CONSTANT } from '../constants';
import { starMapData } from './starmap';

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

interface SectorData {
    star: CelestialBody;
    planets: CelestialBody[];
    asteroids: Asteroid[];
    rangerStation: RangerStation | null;
    hyperspaceGate: HyperspaceGate | null;
}

export const generateSector = (sectorLevel: number, systemId: string): SectorData => {
  if (systemId === 'sol') {
    const star: CelestialBody = {
      id: 'star-sol',
      type: 'star',
      position: { x: GAME_WORLD_SIZE / 2, y: GAME_WORLD_SIZE / 2 },
      velocity: { x: 0, y: 0 },
      radius: 120,
      mass: 150000,
    };

    const planets: CelestialBody[] = [];
    
    const createPlanet = (id: string, name: string, orbitRadius: number, radius: number, mass: number, planetType: CelestialBody['planetType'], hasRings = false, variant?: number) => {
        const angle = randomBetween(0, Math.PI * 2);
        const orbitalVelocityMag = Math.sqrt((GRAVITATIONAL_CONSTANT * star.mass) / orbitRadius);
        const angularVelocity = orbitalVelocityMag / orbitRadius;
        return {
            id: `planet-sol-${id}`,
            type: 'planet',
            name,
            position: {
                x: star.position.x + Math.cos(angle) * orbitRadius,
                y: star.position.y + Math.sin(angle) * orbitRadius,
            },
            velocity: {
                x: Math.sin(angle) * -orbitalVelocityMag,
                y: Math.cos(angle) * orbitalVelocityMag,
            },
            radius,
            mass,
            planetType,
            hasRings,
            variant,
            orbitRadius,
            orbitAngle: angle,
            angularVelocity,
            orbitsAround: star.id,
        } as CelestialBody;
    };

    const mercury = createPlanet('mercury', 'Mercury', 800, 15, 1500, 'rocky');
    const venus = createPlanet('venus', 'Venus', 1200, 25, 2500, 'venus');
    const earth = createPlanet('earth', 'Earth', 1700, 30, 3000, 'terran');
    earth.atmosphereColor = 'rgba(173, 216, 230, 0.4)';
    const mars = createPlanet('mars', 'Mars', 2200, 22, 2200, 'mars');
    const jupiter = createPlanet('jupiter', 'Jupiter', 3400, 70, 70000, 'gas_giant', false, 1);
    jupiter.atmosphereColor = 'rgba(244, 162, 97, 0.3)';

    const moonOrbitRadius = 80;
    const moonAngle = randomBetween(0, Math.PI * 2);
    const moonOrbitalVelocityMag = Math.sqrt((GRAVITATIONAL_CONSTANT * earth.mass) / moonOrbitRadius);
    const moonAngularVelocity = moonOrbitalVelocityMag / moonOrbitRadius;
    const moon: CelestialBody = {
        id: 'planet-sol-moon',
        type: 'planet',
        name: 'Moon',
        position: {
            x: earth.position.x + Math.cos(moonAngle) * moonOrbitRadius,
            y: earth.position.y + Math.sin(moonAngle) * moonOrbitRadius,
        },
        velocity: {
            x: earth.velocity.x + Math.sin(moonAngle) * -moonOrbitalVelocityMag,
            y: earth.velocity.y + Math.cos(moonAngle) * moonOrbitalVelocityMag,
        },
        radius: 8,
        mass: 80,
        planetType: 'moon',
        orbitRadius: moonOrbitRadius,
        orbitAngle: moonAngle,
        angularVelocity: moonAngularVelocity,
        orbitsAround: earth.id,
    };
    
    planets.push(mercury, venus, earth, mars, jupiter, moon);

    const asteroids: Asteroid[] = [];
    const numAsteroidsInBelt = 70;
    for (let i = 0; i < numAsteroidsInBelt; i++) {
        const orbitRadius = randomBetween(2600, 3000);
        const angle = randomBetween(0, Math.PI * 2);
        const orbitalVelocityMag = Math.sqrt((GRAVITATIONAL_CONSTANT * star.mass) / orbitRadius);

        const position = {
            x: star.position.x + Math.cos(angle) * orbitRadius,
            y: star.position.y + Math.sin(angle) * orbitRadius,
        };

        const radius = randomBetween(8, 25);
        asteroids.push({
            id: `asteroid-sol-${i}`,
            type: 'asteroid',
            position,
            velocity: {
                 x: (Math.sin(angle) * -orbitalVelocityMag) + randomBetween(-0.3, 0.3),
                 y: (Math.cos(angle) * orbitalVelocityMag) + randomBetween(-0.3, 0.3),
            },
            radius,
            health: radius,
            mass: radius,
            rotation: randomBetween(0, Math.PI * 2),
            rotationSpeed: randomBetween(-0.02, 0.02),
        });
    }

    const rangerStation: RangerStation = {
        id: 'ranger-station-erebus',
        type: 'ranger_station',
        name: 'Erebus Station',
        position: { x: GAME_WORLD_SIZE - 800, y: GAME_WORLD_SIZE / 2 },
        velocity: { x: 0, y: 0 },
        radius: 50,
    };
    
    const hyperspaceGate: HyperspaceGate = {
        id: 'hyperspace-gate-sol',
        type: 'hyperspace_gate',
        position: { x: 800, y: GAME_WORLD_SIZE / 2 },
        velocity: { x: 0, y: 0 },
        radius: 100,
    };


    return { star, planets, asteroids, rangerStation, hyperspaceGate };
  }
  
  const currentSystem = starMapData.systems.find(s => s.id === systemId);
  const systemName = currentSystem ? currentSystem.name : 'Unknown';

  const star: CelestialBody = {
    id: `star-${sectorLevel}`,
    type: 'star',
    position: { x: GAME_WORLD_SIZE / 2, y: GAME_WORLD_SIZE / 2 },
    velocity: { x: 0, y: 0 },
    radius: randomBetween(100, 150),
    mass: randomBetween(120000, 180000),
  };

  const planets: CelestialBody[] = [];
  const numPlanets = Math.floor(randomBetween(1, 4 + sectorLevel * 0.5));

  for (let i = 0; i < numPlanets; i++) {
    const planetTypes = [
        { type: 'rocky', weight: 4 }, { type: 'ice', weight: 3 },
        { type: 'gas_giant', weight: 2 }, { type: 'lava', weight: 1 },
        { type: 'moon', weight: 4 }, { type: 'terran', weight: 0.5 },
    ] as const;
    const totalWeight = planetTypes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let chosenType: typeof planetTypes[number]['type'] = 'rocky';
    for (const planet of planetTypes) {
        if (random < planet.weight) {
            chosenType = planet.type;
            break;
        }
        random -= planet.weight;
    }

    let radius: number;
    let orbitRadius: number;
    let hasRings = false;
    let atmosphereColor: string | undefined = undefined;
    let variant: number | undefined = undefined;

    switch (chosenType) {
        case 'gas_giant':
            radius = randomBetween(60, 90);
            orbitRadius = randomBetween(3600, GAME_WORLD_SIZE / 2 - 600);
            hasRings = Math.random() < 0.7;
            variant = Math.floor(randomBetween(1, 3)); // 1 or 2
            atmosphereColor = Math.random() < 0.5 ? 'rgba(244, 162, 97, 0.3)' : 'rgba(165, 195, 227, 0.3)';
            break;
        case 'terran':
            radius = randomBetween(30, 45);
            orbitRadius = randomBetween(2000, 3600); // Habitable zone
            atmosphereColor = 'rgba(173, 216, 230, 0.4)';
            break;
        case 'ice':
            radius = randomBetween(25, 50);
            orbitRadius = randomBetween(3200, GAME_WORLD_SIZE / 2 - 400);
            hasRings = Math.random() < 0.1;
            break;
        case 'lava':
            radius = randomBetween(20, 40);
            orbitRadius = randomBetween(1200, 2400); // Close to star
            break;
        case 'moon':
            radius = randomBetween(12, 25);
            orbitRadius = randomBetween(1600, GAME_WORLD_SIZE / 2 - 400);
            break;
        case 'rocky':
        default:
            radius = randomBetween(25, 55);
            orbitRadius = randomBetween(1600, GAME_WORLD_SIZE / 2 - 400);
            break;
    }
    
    const mass = radius * 100;
    const angle = randomBetween(0, Math.PI * 2);
    const orbitalVelocityMag = Math.sqrt((GRAVITATIONAL_CONSTANT * star.mass) / orbitRadius);
    const angularVelocity = orbitalVelocityMag / orbitRadius;
    
    planets.push({
      id: `planet-${sectorLevel}-${i}`,
      type: 'planet',
      name: `${systemName} ${i + 1}`,
      position: {
        x: star.position.x + Math.cos(angle) * orbitRadius,
        y: star.position.y + Math.sin(angle) * orbitRadius,
      },
      velocity: {
        x: Math.sin(angle) * -orbitalVelocityMag,
        y: Math.cos(angle) * orbitalVelocityMag,
      },
      radius,
      mass,
      planetType: chosenType,
      hasRings,
      atmosphereColor,
      variant,
      orbitRadius,
      orbitAngle: angle,
      angularVelocity,
      orbitsAround: star.id,
    });
  }

  const asteroids: Asteroid[] = [];
  const numAsteroids = Math.floor(randomBetween(20, 40 + sectorLevel * 4));
  
  for (let i = 0; i < numAsteroids; i++) {
    const position = {
      x: randomBetween(0, GAME_WORLD_SIZE),
      y: randomBetween(0, GAME_WORLD_SIZE),
    };

    // Avoid spawning too close to the star
    const distFromStar = Math.sqrt((position.x - star.position.x)**2 + (position.y - star.position.y)**2);
    if (distFromStar < star.radius + 800) {
      i--; // try again
      continue;
    }

    const radius = randomBetween(10, 30);
    asteroids.push({
      id: `asteroid-${sectorLevel}-${i}`,
      type: 'asteroid',
      position,
      velocity: {
        x: randomBetween(-0.5, 0.5),
        y: randomBetween(-0.5, 0.5),
      },
      radius,
      health: radius,
      mass: radius,
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.02, 0.02),
    });
  }

  const hyperspaceGate: HyperspaceGate = {
    id: `hyperspace-gate-${systemId}`,
    type: 'hyperspace_gate',
    position: { x: 800, y: GAME_WORLD_SIZE / 2 },
    velocity: { x: 0, y: 0 },
    radius: 100,
  };

  return { star, planets, asteroids, rangerStation: null, hyperspaceGate };
};

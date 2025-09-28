

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
}

export interface Ship extends GameObject {
  type: 'ship';
  angle: number; // in radians
  health: number;
  ammo: number;
  resources: number; // Crystals for jumping
  dollars: number; // Currency for upgrades
  homingMissiles: number;
  isThrusting: boolean;
  invulnerable: number; // invulnerability frames
  hullLevel: number;
  engineLevel: number;
  weaponLevel: number;
  ammoCapLevel: number;
  magnetLevel: number;
}

export interface Pirate extends GameObject {
  type: 'pirate';
  angle: number;
  health: number;
  aiState: 'HUNTING' | 'ATTACKING' | 'IDLE';
  lastShotTime: number;
}

export interface MissionTarget extends GameObject {
  type: 'mission_target';
  name: string;
  angle: number;
  health: number;
  aiState: 'HUNTING' | 'ATTACKING' | 'IDLE';
  lastShotTime: number;
}

export interface CelestialBody extends GameObject {
  type: 'star' | 'planet';
  name?: string;
  mass: number;
  planetType?: 'rocky' | 'gas_giant' | 'ice' | 'terran' | 'lava' | 'moon' | 'mars' | 'venus';
  hasRings?: boolean;
  atmosphereColor?: string; // e.g., 'hsla(200, 100%, 80%, 0.5)'
  variant?: number;
  orbitRadius?: number;
  orbitAngle?: number;
  angularVelocity?: number;
  orbitsAround?: string; // ID of the body it orbits
}

export interface Asteroid extends GameObject {
  type: 'asteroid';
  health: number;
  mass: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Debris extends GameObject {
  type: 'debris';
  life: number; // lifespan in frames
  rotation: number;
  rotationSpeed: number;
}

export interface Projectile extends GameObject {
  type: 'projectile' | 'enemy_projectile';
  life: number; // lifespan in frames
}

export interface HomingMissile extends GameObject {
  type: 'homing_missile';
  life: number;
  targetId: string | null;
}

export interface HomingMissilePickup extends GameObject {
  type: 'homing_missile_pickup';
}

export interface Resource extends GameObject {
  type: 'resource';
}

export interface Explosion {
    id: string;
    position: Vector2D;
    life: number; // Frames
    radius: number;
    explosionType: 'rich' | 'dud';
}

export interface RangerStation extends GameObject {
    type: 'ranger_station';
    name: string;
}

export interface HyperspaceGate extends GameObject {
    type: 'hyperspace_gate';
}

export type UpgradeType = 'hull' | 'engine' | 'weapon' | 'ammoCap' | 'magnet';

export type MissionObjective = 
  | { type: 'HUNT'; targetName: string; targetId: string; targetSystemId: string; }
  | { type: 'COLLECT'; amount: number; collected: number; };

export interface Mission {
    id: string;
    title: string;
    description: string;
    objective: MissionObjective;
    reward: {
        dollars: number;
        homingMissiles?: number;
    };
    status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface StarSystemNode {
  id: string;
  name: string;
  position: Vector2D; // For map display
  level: number; // Difficulty/richness
  description:string;
}

export interface StarMapData {
  systems: StarSystemNode[];
  connections: [string, string][]; // Pairs of system IDs
}

export interface GameState {
  ship: Ship;
  star: CelestialBody;
  planets: CelestialBody[];
  asteroids: Asteroid[];
  pirates: Pirate[];
  missionTargets: MissionTarget[];
  projectiles: Projectile[];
  homingMissiles: HomingMissile[];
  resources: Resource[];
  homingMissilePickups: HomingMissilePickup[];
  debris: Debris[];
  explosions: Explosion[];
  rangerStation: RangerStation | null;
  hyperspaceGate: HyperspaceGate | null;
  currentSystemId: string;
  isGameOver: boolean;
  gameStarted: boolean;
  isJumping: boolean;
  isStationMenuOpen: boolean;
  currentMission: Mission | null;
  gravity: number;
}
import type { Ship, Vector2D } from './types';

export const GAME_WORLD_SIZE = 8000;
export const GRAVITATIONAL_CONSTANT = 0.1;

// Ship
export const SHIP_MASS = 1;
export const SHIP_THRUST = 0.05;
export const SHIP_TURN_SPEED = 0.07; // radians per frame
export const SHIP_MAX_HEALTH = 100;
export const SHIP_MAX_AMMO = 20;
export const SHIP_AMMO_RECHARGE_RATE = 0.02; // ammo per frame
export const SHIP_RADIUS = 12;
export const SHIP_INVULNERABILITY_FRAMES = 120; // 2 seconds at 60fps
export const SHIP_DAMPING = 0.998; // Reduces slipperiness (higher value = more drift)
export const SHIP_BRAKE_THRUST = 0.01; // Auto-brake strength
export const SHIP_MANUAL_BRAKE_THRUST = 0.08; // Manual retro-thruster strength

// Projectile
export const PROJECTILE_SPEED = 7;
export const PROJECTILE_RADIUS = 2;
export const PROJECTILE_LIFESPAN = 120; // frames
export const PROJECTILE_COOLDOWN = 10; // frames

// Homing Missile
export const HOMING_MISSILE_SPEED = 4;
export const HOMING_MISSILE_TURN_SPEED = 0.08;
export const HOMING_MISSILE_LIFESPAN = 400; // frames
export const HOMING_MISSILE_DAMAGE = 100;

// Pirate
export const PIRATE_HEALTH = 30;
export const PIRATE_RADIUS = 11;
export const PIRATE_THRUST = 0.03;
export const PIRATE_TURN_SPEED = 0.04;
export const PIRATE_DETECTION_RANGE = 1000;
export const PIRATE_ATTACK_RANGE = 600;
export const PIRATE_COOLDOWN = 120; // frames
export const PIRATE_PROJECTILE_SPEED = 4;

// Asteroid
export const ASTEROID_BASE_HEALTH = 20;
export const ASTEROID_BASE_MASS = 5;
export const ASTEROID_CRYSTAL_DROP_CHANCE = 0.35;

// Resources
export const HYPERJUMP_COST = 5;
export const RESOURCE_MAGNET_RANGE = 180;
export const RESOURCE_MAGNET_FORCE = 0.2;
export const MAX_RESOURCE_SPEED = 5;
export const MAX_GRAVITY_FOR_HUD = 0.25;

export const INITIAL_SHIP_STATE: Ship = {
  id: 'player-ship',
  type: 'ship',
  position: { x: GAME_WORLD_SIZE / 2 + 300, y: GAME_WORLD_SIZE / 2 },
  velocity: { x: 0, y: -1.5 },
  radius: SHIP_RADIUS,
  angle: -Math.PI / 2,
  health: SHIP_MAX_HEALTH,
  ammo: SHIP_MAX_AMMO,
  resources: 0,
  dollars: 100,
  homingMissiles: 0,
  isThrusting: false,
  invulnerable: SHIP_INVULNERABILITY_FRAMES,
  hullLevel: 1,
  engineLevel: 1,
  weaponLevel: 1,
  ammoCapLevel: 1,
  magnetLevel: 1,
};
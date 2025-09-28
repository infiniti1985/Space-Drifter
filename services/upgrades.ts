import type { UpgradeType } from '../types';
import { 
    SHIP_MAX_HEALTH, SHIP_THRUST, SHIP_TURN_SPEED, PROJECTILE_COOLDOWN, 
    SHIP_MAX_AMMO, RESOURCE_MAGNET_RANGE 
} from '../constants';

export interface UpgradeInfo {
    id: UpgradeType;
    maxLevel: number;
    getCost: (level: number) => number;
}

export const upgradesConfig: Record<UpgradeType, UpgradeInfo> = {
    hull: {
        id: 'hull',
        maxLevel: 5,
        getCost: (level) => 50 + Math.floor(Math.pow(level, 2) * 20),
    },
    engine: {
        id: 'engine',
        maxLevel: 5,
        getCost: (level) => 60 + Math.floor(Math.pow(level, 2) * 18),
    },
    weapon: {
        id: 'weapon',
        maxLevel: 5,
        getCost: (level) => 80 + Math.floor(Math.pow(level, 2) * 25),
    },
    ammoCap: {
        id: 'ammoCap',
        maxLevel: 5,
        getCost: (level) => 40 + Math.floor(Math.pow(level, 1.8) * 20),
    },
    magnet: {
        id: 'magnet',
        maxLevel: 5,
        getCost: (level) => 30 + level * 30,
    },
};

// Functions to calculate stats based on level
export const getMaxHealth = (level: number) => SHIP_MAX_HEALTH + (level - 1) * 25;
export const getThrust = (level: number) => SHIP_THRUST * (1 + (level - 1) * 0.15);
export const getTurnSpeed = (level: number) => SHIP_TURN_SPEED * (1 + (level - 1) * 0.15);
export const getWeaponCooldown = (level: number) => PROJECTILE_COOLDOWN * (1 - (level - 1) * 0.1); // Cooldown decreases
export const getMaxAmmo = (level: number) => SHIP_MAX_AMMO + (level - 1) * 5;
export const getMagnetRange = (level: number) => RESOURCE_MAGNET_RANGE + (level - 1) * 40;
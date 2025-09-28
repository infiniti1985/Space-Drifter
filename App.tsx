
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GameState, Ship, GameObject, CelestialBody, Asteroid, Projectile, Resource, Vector2D, Pirate, HomingMissile, HomingMissilePickup, Explosion, MissionTarget, Mission, RangerStation, UpgradeType, Debris } from './types';
import { 
    GAME_WORLD_SIZE, SHIP_THRUST, SHIP_TURN_SPEED, GRAVITATIONAL_CONSTANT, PROJECTILE_SPEED,
    PROJECTILE_LIFESPAN, INITIAL_SHIP_STATE, SHIP_MASS, HYPERJUMP_COST, SHIP_AMMO_RECHARGE_RATE, SHIP_MAX_HEALTH, SHIP_INVULNERABILITY_FRAMES,
    PIRATE_HEALTH, PIRATE_RADIUS, PIRATE_THRUST, PIRATE_TURN_SPEED, PIRATE_DETECTION_RANGE, PIRATE_ATTACK_RANGE, PIRATE_COOLDOWN, PIRATE_PROJECTILE_SPEED,
    HOMING_MISSILE_LIFESPAN, HOMING_MISSILE_SPEED, HOMING_MISSILE_TURN_SPEED, HOMING_MISSILE_DAMAGE,
    SHIP_DAMPING, SHIP_BRAKE_THRUST, RESOURCE_MAGNET_FORCE, MAX_RESOURCE_SPEED, SHIP_MANUAL_BRAKE_THRUST, ASTEROID_CRYSTAL_DROP_CHANCE
} from './constants';
import * as Vec from './utils/vector';
import { generateSector } from './services/sectorGenerator';
import { starMapData } from './services/starmap';
import { upgradesConfig, getMaxHealth, getThrust, getTurnSpeed, getWeaponCooldown, getMaxAmmo, getMagnetRange } from './services/upgrades';
import Hud from './components/Hud';
import ParallaxBackground from './components/ParallaxBackground';
import Radar from './components/Radar';
import NavArrow from './components/NavArrow';
import HyperspaceEffect from './components/HyperspaceEffect';
import MissionDisplay from './components/MissionDisplay';
import StarMap from './components/StarMap';
import RangerStationMenu from './components/RangerStationMenu';
import { audioEngine } from './services/audioEngine';
import { createTranslator, Language } from './services/localization';


const getInitialGameState = (systemId: string): GameState => {
    const system = starMapData.systems.find(s => s.id === systemId);
    if (!system) throw new Error(`System ${systemId} not found!`);

    const { star, planets, asteroids, rangerStation, hyperspaceGate } = generateSector(system.level, systemId);

    const spawnOrbitRadius = systemId === 'sol' ? 1800 : 1600; 
    const shipPosition = { x: star.position.x + spawnOrbitRadius, y: star.position.y };
    const orbitalVelocityMag = Math.sqrt((GRAVITATIONAL_CONSTANT * star.mass) / spawnOrbitRadius);
    const shipVelocity = { x: 0, y: -orbitalVelocityMag };

    return {
        ship: {
            ...INITIAL_SHIP_STATE,
            position: shipPosition,
            velocity: shipVelocity,
        },
        star,
        planets,
        asteroids,
        pirates: [],
        missionTargets: [],
        projectiles: [],
        homingMissiles: [],
        resources: [],
        homingMissilePickups: [],
        debris: [],
        explosions: [],
        rangerStation,
        hyperspaceGate,
        currentSystemId: systemId,
        isGameOver: false,
        gameStarted: false,
        isJumping: false,
        isStationMenuOpen: false,
        currentMission: null,
        gravity: 0,
    };
};

const Starfield = () => {
    const starLayers = useMemo(() => {
        const layers = [];
        // Layer 1: Distant, small, slow stars
        const layer1 = [];
        for (let i = 0; i < 80; i++) {
            layer1.push({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '1px',
                height: '1px',
            });
        }
        layers.push(layer1);

        // Layer 2: Medium distance stars
        const layer2 = [];
        for (let i = 0; i < 50; i++) {
            layer2.push({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '2px',
                height: '2px',
            });
        }
        layers.push(layer2);

        // Layer 3: Close, large, fast stars
        const layer3 = [];
        for (let i = 0; i < 30; i++) {
            layer3.push({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '3px',
                height: '3px',
            });
        }
        layers.push(layer3);

        return layers;
    }, []);

    return (
        <div className="stars-container">
            {starLayers.map((stars, layerIndex) => (
                <div key={layerIndex} className={`stars-layer stars-layer-${layerIndex + 1}`}>
                    {stars.map((style, starIndex) => (
                        <div key={starIndex} className="star" style={style} />
                    ))}
                </div>
            ))}
        </div>
    );
};


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(getInitialGameState('sol'));
    const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const keysPressed = useRef<Record<string, boolean>>({});
    const lastShotTime = useRef<number>(0);
    const requestRef = useRef<number | null>(null);
    const [splashPhase, setSplashPhase] = useState(0);
    const [lang, setLang] = useState<Language>('ru');
    const [isMapOpen, setMapOpen] = useState(false);
    const gateActivatedRef = useRef(false);
    
    const t = useMemo(() => createTranslator(lang), [lang]);

    const gameStartedRef = useRef(gameState.gameStarted);
    useEffect(() => {
        gameStartedRef.current = gameState.gameStarted;
    });

    useEffect(() => {
        const unlockAudioAndRemoveListener = () => {
            audioEngine.unlockAudio();
            if (!gameStartedRef.current) {
                audioEngine.playMusic();
            }
            window.removeEventListener('click', unlockAudioAndRemoveListener);
            window.removeEventListener('keydown', unlockAudioAndRemoveListener);
        };
        window.addEventListener('click', unlockAudioAndRemoveListener);
        window.addEventListener('keydown', unlockAudioAndRemoveListener);

        return () => {
            window.removeEventListener('click', unlockAudioAndRemoveListener);
            window.removeEventListener('keydown', unlockAudioAndRemoveListener);
        };
    }, []);

    const prevMissionStatus = useRef<string | null>(null);
    useEffect(() => {
        const currentStatus = gameState.currentMission?.status;
        if (currentStatus === 'COMPLETED' && prevMissionStatus.current !== 'COMPLETED') {
            audioEngine.playSound('mission_complete');
        }
        prevMissionStatus.current = currentStatus ?? null;
    }, [gameState.currentMission?.status]);

    useEffect(() => {
        if (!gameState.gameStarted) {
            const timers = [
                setTimeout(() => setSplashPhase(1), 500),
                setTimeout(() => setSplashPhase(2), 2500),
                setTimeout(() => setSplashPhase(3), 3000),
                setTimeout(() => setSplashPhase(4), 4500),
            ];
            audioEngine.playMusic();
            return () => {
                timers.forEach(clearTimeout);
                audioEngine.stopMusic();
            };
        }
    }, [gameState.gameStarted]);

    const acceptMission = useCallback((mission: Mission) => {
        audioEngine.playSound('confirm');
        setGameState(prev => {
            return {
                ...prev,
                currentMission: mission,
                isStationMenuOpen: false,
            };
        });
    }, []);

    const handleUpgrade = useCallback((upgradeType: UpgradeType) => {
        setGameState(prev => {
            const { ship } = prev;
            const config = upgradesConfig[upgradeType];
            let currentLevel: number;
            switch(upgradeType) {
                case 'hull': currentLevel = ship.hullLevel; break;
                case 'engine': currentLevel = ship.engineLevel; break;
                case 'weapon': currentLevel = ship.weaponLevel; break;
                case 'ammoCap': currentLevel = ship.ammoCapLevel; break;
                case 'magnet': currentLevel = ship.magnetLevel; break;
            }
    
            if (currentLevel >= config.maxLevel) return prev;
    
            const cost = config.getCost(currentLevel);
            if (ship.dollars < cost) {
                audioEngine.playSound('error');
                return prev;
            }
            
            audioEngine.playSound('confirm');
    
            const newShip = { ...ship };
            newShip.dollars -= cost;
            switch(upgradeType) {
                case 'hull': 
                    newShip.hullLevel++; 
                    newShip.health = getMaxHealth(newShip.hullLevel); // Heal to new max
                    break;
                case 'engine': newShip.engineLevel++; break;
                case 'weapon': newShip.weaponLevel++; break;
                case 'ammoCap': newShip.ammoCapLevel++; break;
                case 'magnet': newShip.magnetLevel++; break;
            }
    
            return { ...prev, ship: newShip };
        });
    }, []);
    
    const restartGame = useCallback(() => {
        audioEngine.playSound('confirm');
        setSplashPhase(0);
        setGameState(getInitialGameState('sol'));
    }, []);
    
    const createExplosion = (position: Vector2D, radius: number, type: 'rich' | 'dud') => ({
      id: `expl-${performance.now()}`,
      position,
      radius,
      life: 20, // frames
      explosionType: type,
    });

    const handleCloseMap = () => {
        setMapOpen(false);
        // Apply a small push to the ship away from the gate to prevent immediate re-triggering
        setGameState(prev => {
            if (!prev.hyperspaceGate) return prev;
            const pushDirection = Vec.normalize(Vec.subtract(prev.ship.position, prev.hyperspaceGate.position));
            const newVelocity = Vec.add(prev.ship.velocity, Vec.scale(pushDirection, 2.0)); 
            return {
                ...prev,
                ship: { ...prev.ship, velocity: newVelocity }
            };
        });
    };

    const hyperJump = useCallback((targetSystemId: string) => {
        setMapOpen(false);
        gateActivatedRef.current = false;
        setGameState(prevState => {
            if (prevState.ship.resources < HYPERJUMP_COST || prevState.isJumping) {
                audioEngine.playSound('error');
                return prevState;
            }
            audioEngine.playSound('jump');
            return {...prevState, isJumping: true};
        });

        setTimeout(() => {
            setGameState(prevState => {
                const newSystem = starMapData.systems.find(s => s.id === targetSystemId);
                if (!newSystem) return prevState;

                const newGameState = getInitialGameState(targetSystemId);
                
                let newMissionTargets = [...prevState.missionTargets];
                
                // Spawn mission target if we jumped to the right system
                if (prevState.currentMission?.objective.type === 'HUNT' && prevState.currentMission.objective.targetSystemId === targetSystemId) {
                    const objective = prevState.currentMission.objective;

                    // Check if target isn't already spawned (e.g. re-entering system)
                    if (!newMissionTargets.some(t => t.id === objective.targetId)) {
                        const edge = Math.floor(Math.random() * 4);
                        let pos = {x: 0, y: 0};
                        if (edge === 0) pos = {x: Math.random() * GAME_WORLD_SIZE, y: 200};
                        if (edge === 1) pos = {x: Math.random() * GAME_WORLD_SIZE, y: GAME_WORLD_SIZE - 200};
                        if (edge === 2) pos = {x: 200, y: Math.random() * GAME_WORLD_SIZE};
                        if (edge === 3) pos = {x: GAME_WORLD_SIZE - 200, y: Math.random() * GAME_WORLD_SIZE};
                        
                        newMissionTargets.push({
                            id: objective.targetId,
                            name: objective.targetName,
                            type: 'mission_target',
                            position: pos,
                            velocity: { x: 0, y: 0},
                            radius: PIRATE_RADIUS + 2,
                            angle: 0,
                            health: PIRATE_HEALTH * 3, // Stronger
                            aiState: 'HUNTING',
                            lastShotTime: 0,
                        });
                    }
                }


                return {
                    ...newGameState,
                    gameStarted: true,
                    ship: {
                        ...prevState.ship, // Carry over upgrades and stats
                        position: newGameState.ship.position,
                        velocity: newGameState.ship.velocity,
                        resources: prevState.ship.resources - HYPERJUMP_COST,
                        invulnerable: SHIP_INVULNERABILITY_FRAMES,
                    },
                    isJumping: false,
                    currentMission: prevState.currentMission,
                    missionTargets: newMissionTargets,
                };
            });
        }, 1500);
    }, []);

    const gameLoop = useCallback(() => {
        setGameState(prev => {
            if (prev.isGameOver || !prev.gameStarted || prev.isJumping || prev.isStationMenuOpen) {
                return prev;
            }

            const now = performance.now();

            // Create mutable copies of state for this frame
            let ship = { ...prev.ship };
            let pirates = [...prev.pirates];
            let missionTargets = [...prev.missionTargets];
            let asteroids = prev.asteroids.map(a => ({...a}));
            let projectiles = [...prev.projectiles];
            let homingMissiles = [...prev.homingMissiles];
            let resources = [...prev.resources];
            let homingMissilePickups = [...prev.homingMissilePickups];
            let explosions = [...prev.explosions];
            let debris = [...prev.debris];
            let planets = prev.planets.map(p => ({...p}));
            let currentMission = prev.currentMission ? JSON.parse(JSON.stringify(prev.currentMission)) : null;
            const { star, rangerStation, hyperspaceGate } = prev;

            const currentMaxHealth = getMaxHealth(ship.hullLevel);
            const currentMaxAmmo = getMaxAmmo(ship.ammoCapLevel);
            const currentWeaponCooldown = getWeaponCooldown(ship.weaponLevel);
            const currentThrust = getThrust(ship.engineLevel);
            const currentTurnSpeed = getTurnSpeed(ship.engineLevel);
            const currentMagnetRange = getMagnetRange(ship.magnetLevel);

            planets.forEach(p => {
                if (p.orbitsAround === star.id) {
                    if (p.orbitRadius && typeof p.orbitAngle !== 'undefined' && p.angularVelocity) {
                        p.orbitAngle += p.angularVelocity;
                        p.position.x = star.position.x + Math.cos(p.orbitAngle) * p.orbitRadius;
                        p.position.y = star.position.y + Math.sin(p.orbitAngle) * p.orbitRadius;
                        
                        const orbitalVelocityMag = p.angularVelocity * p.orbitRadius;
                        p.velocity.x = Math.sin(p.orbitAngle) * -orbitalVelocityMag;
                        p.velocity.y = Math.cos(p.orbitAngle) * orbitalVelocityMag;
                    }
                }
            });
            planets.forEach(p => {
                if (p.orbitsAround && p.orbitsAround !== star.id) {
                     if (p.orbitRadius && typeof p.orbitAngle !== 'undefined' && p.angularVelocity) {
                        const parent = planets.find(parent => parent.id === p.orbitsAround);
                        if (parent) {
                            p.orbitAngle += p.angularVelocity;
                            p.position.x = parent.position.x + Math.cos(p.orbitAngle) * p.orbitRadius;
                            p.position.y = parent.position.y + Math.sin(p.orbitAngle) * p.orbitRadius;
                            
                            const orbitalVelocityMag = p.angularVelocity * p.orbitRadius;
                            p.velocity.x = parent.velocity.x + Math.sin(p.orbitAngle) * -orbitalVelocityMag;
                            p.velocity.y = parent.velocity.y + Math.cos(p.orbitAngle) * orbitalVelocityMag;
                        }
                     }
                }
            });

            ship.isThrusting = false;
            if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) {
                const thrustVector = { x: Math.cos(ship.angle) * currentThrust, y: Math.sin(ship.angle) * currentThrust };
                ship.velocity = Vec.add(ship.velocity, thrustVector);
                ship.isThrusting = true;
            }
            if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) {
                if (Vec.magnitude(ship.velocity) > 0.05) {
                    const brakeForce = Vec.scale(Vec.normalize(ship.velocity), -SHIP_MANUAL_BRAKE_THRUST);
                    ship.velocity = Vec.add(ship.velocity, brakeForce);
                } else {
                    ship.velocity = {x: 0, y: 0};
                }
            }
            if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) ship.angle -= currentTurnSpeed;
            if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) ship.angle += currentTurnSpeed;
            
            if (keysPressed.current[' '] && ship.ammo >= 1 && (now - lastShotTime.current > currentWeaponCooldown * (1000/60)) ) {
                projectiles.push({
                    id: `proj-${now}`, type: 'projectile',
                    position: { x: ship.position.x + Math.cos(ship.angle) * (ship.radius + 1), y: ship.position.y + Math.sin(ship.angle) * (ship.radius + 1) },
                    velocity: { x: ship.velocity.x + Math.cos(ship.angle) * PROJECTILE_SPEED, y: ship.velocity.y + Math.sin(ship.angle) * PROJECTILE_SPEED },
                    radius: 2, life: PROJECTILE_LIFESPAN,
                });
                ship.ammo -= 1;
                lastShotTime.current = now;
                audioEngine.playSound('shoot');
            }
            if (keysPressed.current['Shift'] && ship.homingMissiles > 0) {
                let closestTarget: Pirate | MissionTarget | Asteroid | null = null;
                let minDistance = Infinity;
                [...pirates, ...missionTargets, ...asteroids].forEach(a => {
                    const d = Vec.distance(ship.position, a.position);
                    if (d < minDistance && d < PIRATE_ATTACK_RANGE * 2) {
                        minDistance = d;
                        closestTarget = a;
                    }
                });
                if (closestTarget) {
                    homingMissiles.push({
                        id: `hm-${now}`, type: 'homing_missile',
                        position: { ...ship.position }, velocity: { ...ship.velocity },
                        radius: 5, life: HOMING_MISSILE_LIFESPAN,
                        targetId: closestTarget.id,
                    });
                    ship.homingMissiles -= 1;
                    keysPressed.current['Shift'] = false;
                    audioEngine.playSound('missile');
                }
            }

            const allEnemies = [...pirates, ...missionTargets];
            allEnemies.forEach(p => {
                const distToShip = Vec.distance(p.position, ship.position);
                const targetAngle = Math.atan2(ship.position.y - p.position.y, ship.position.x - p.position.x);
                let angleDiff = targetAngle - p.angle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                if (Math.abs(angleDiff) > PIRATE_TURN_SPEED) p.angle += Math.sign(angleDiff) * PIRATE_TURN_SPEED;
                else p.angle = targetAngle;
                
                if (distToShip < PIRATE_DETECTION_RANGE * 1.5) {
                    const thrust = {x: Math.cos(p.angle) * PIRATE_THRUST, y: Math.sin(p.angle) * PIRATE_THRUST};
                    p.velocity = Vec.add(p.velocity, thrust);

                    if (distToShip < PIRATE_ATTACK_RANGE && Math.abs(angleDiff) < 0.5 && now - p.lastShotTime > PIRATE_COOLDOWN * (1000/60)) {
                        projectiles.push({
                            id: `eproj-${now}-${p.id}`, type: 'enemy_projectile',
                            position: { x: p.position.x + Math.cos(p.angle) * (p.radius + 1), y: p.position.y + Math.sin(p.angle) * (p.radius + 1) },
                            velocity: { x: p.velocity.x + Math.cos(p.angle) * PIRATE_PROJECTILE_SPEED, y: p.velocity.y + Math.sin(p.angle) * PIRATE_PROJECTILE_SPEED },
                            radius: 3, life: PROJECTILE_LIFESPAN,
                        });
                        p.lastShotTime = now;
                    }
                }
            });
            
            const currentSystem = starMapData.systems.find(s => s.id === prev.currentSystemId)!;
            if (pirates.length < currentSystem.level && Math.random() < 0.001 * currentSystem.level) {
                const edge = Math.floor(Math.random() * 4);
                let pos = {x: 0, y: 0};
                if (edge === 0) pos = {x: Math.random() * GAME_WORLD_SIZE, y: 0}; else if (edge === 1) pos = {x: Math.random() * GAME_WORLD_SIZE, y: GAME_WORLD_SIZE}; else if (edge === 2) pos = {x: 0, y: Math.random() * GAME_WORLD_SIZE}; else pos = {x: GAME_WORLD_SIZE, y: Math.random() * GAME_WORLD_SIZE};
                pirates.push({
                    id: `pirate-${now}`, type: 'pirate', position: pos, velocity: { x: 0, y: 0}, radius: PIRATE_RADIUS,
                    angle: 0, health: PIRATE_HEALTH, aiState: 'HUNTING', lastShotTime: 0,
                });
            }

            homingMissiles.forEach(hm => {
                const target = [...asteroids, ...pirates, ...missionTargets].find(a => a.id === hm.targetId);
                if (target) {
                    const targetAngle = Math.atan2(target.position.y - hm.position.y, target.position.x - hm.position.x);
                    const angle = Math.atan2(hm.velocity.y, hm.velocity.x);
                    let angleDiff = targetAngle - angle;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    const newAngle = angle + Math.max(-HOMING_MISSILE_TURN_SPEED, Math.min(HOMING_MISSILE_TURN_SPEED, angleDiff));
                    hm.velocity = {x: Math.cos(newAngle) * HOMING_MISSILE_SPEED, y: Math.sin(newAngle) * HOMING_MISSILE_SPEED};
                } else { hm.targetId = null; }
            });

            let gravityMagnitude = 0;
            const allMovableObjects = [ship, ...asteroids, ...projectiles, ...homingMissiles, ...pirates, ...missionTargets, ...debris, ...resources, ...homingMissilePickups];
            allMovableObjects.forEach(obj => {
                let totalForce: Vector2D = { x: 0, y: 0 };
                [star, ...planets].forEach(body => {
                    if (obj.id === body.id) return;
                    const dVec = Vec.subtract(body.position, obj.position);
                    const dist = Vec.magnitude(dVec);
                    if (dist > body.radius) {
                        const mass = 'mass' in obj ? (obj as any).mass : SHIP_MASS;
                        const forceMag = (GRAVITATIONAL_CONSTANT * body.mass * mass) / (dist * dist);
                        totalForce = Vec.add(totalForce, Vec.scale(Vec.normalize(dVec), forceMag));
                    }
                });

                if (obj.id === ship.id) {
                    gravityMagnitude = Vec.magnitude(totalForce);
                }

                const mass = ('mass' in obj && obj.mass) ? obj.mass : SHIP_MASS;
                obj.velocity = Vec.add(obj.velocity, Vec.scale(totalForce, 1 / mass));

                 if (obj.type === 'ship') {
                    if (!obj.isThrusting && Vec.magnitude(obj.velocity) > 0.05) {
                        const brakeForce = Vec.scale(Vec.normalize(obj.velocity), -SHIP_BRAKE_THRUST);
                        obj.velocity = Vec.add(obj.velocity, brakeForce);
                    }
                    obj.velocity = Vec.scale(obj.velocity, SHIP_DAMPING);
                    if (!obj.isThrusting && Vec.magnitude(obj.velocity) < 0.05) {
                        obj.velocity = {x: 0, y: 0};
                    }
                }
                
                if (obj.type === 'resource') {
                    const distToShip = Vec.distance(obj.position, ship.position);
                    if (distToShip < currentMagnetRange) {
                        const pullDirection = Vec.normalize(Vec.subtract(ship.position, obj.position));
                        const strength = RESOURCE_MAGNET_FORCE * (1 - (distToShip / currentMagnetRange));
                        const attractionForce = Vec.scale(pullDirection, strength);
                        obj.velocity = Vec.add(obj.velocity, attractionForce);
                        obj.velocity = Vec.scale(obj.velocity, 0.99);
                        const speed = Vec.magnitude(obj.velocity);
                        if (speed > MAX_RESOURCE_SPEED) {
                            obj.velocity = Vec.scale(Vec.normalize(obj.velocity), MAX_RESOURCE_SPEED);
                        }
                    }
                }

                obj.position = Vec.add(obj.position, obj.velocity);
                if (obj.type === 'asteroid') (obj as Asteroid).rotation += (obj as Asteroid).rotationSpeed;
                if (obj.type === 'debris') {
                    (obj as Debris).rotation += (obj as Debris).rotationSpeed;
                    (obj as Debris).life--;
                }
            });

            if (ship.ammo < currentMaxAmmo) ship.ammo += SHIP_AMMO_RECHARGE_RATE;
            if (ship.invulnerable > 0) ship.invulnerable -= 1;

            // --- Collisions ---
            let newProjectiles = [...projectiles];
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i];
                let projectileHit = false;

                for (let j = asteroids.length - 1; j >= 0; j--) {
                    const a = asteroids[j];
                    if (Vec.distance(p.position, a.position) < p.radius + a.radius) {
                        if (p.type === 'projectile') {
                            a.health -= 10;
                            if (a.health <= 0) {
                                const droppedCrystal = Math.random() < ASTEROID_CRYSTAL_DROP_CHANCE;
                                explosions.push(createExplosion(a.position, a.radius, droppedCrystal ? 'rich' : 'dud'));
                                audioEngine.playSound('explosion');
                                for (let k = 0; k < Math.floor(a.radius / 4) + 3; k++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = Math.random() * 2 + 1;
                                    debris.push({
                                        id: `deb-${a.id}-${k}`, type: 'debris', position: { ...a.position },
                                        velocity: Vec.add(a.velocity, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }),
                                        radius: Math.random() * 4 + 2, life: 60 + Math.random() * 60,
                                        rotation: Math.random() * Math.PI * 2, rotationSpeed: Math.random() * 0.1 - 0.05,
                                    });
                                }
                                if (droppedCrystal) resources.push({ id: `res-${a.id}`, type: 'resource', position: a.position, velocity: a.velocity, radius: 5 });
                                asteroids.splice(j, 1);
                            }
                        }
                        projectileHit = true;
                        break; 
                    }
                }
                if(projectileHit) { newProjectiles.splice(i,1); continue; }

                const currentAllEnemies = [...pirates, ...missionTargets];
                 for (let j = currentAllEnemies.length - 1; j >= 0; j--) {
                     const enemy = currentAllEnemies[j];
                     if (Vec.distance(p.position, enemy.position) < p.radius + enemy.radius) {
                        if (p.type === 'projectile') {
                            enemy.health -= 10;
                            if (enemy.health <= 0) {
                                explosions.push(createExplosion(enemy.position, enemy.radius * 2, 'rich'));
                                audioEngine.playSound('explosion');
                                if (enemy.type === 'pirate') {
                                    homingMissilePickups.push({ id: `hm-pickup-${enemy.id}`, type: 'homing_missile_pickup', position: enemy.position, velocity: enemy.velocity, radius: 8 });
                                    pirates = pirates.filter(x => x.id !== enemy.id);
                                } else if (enemy.type === 'mission_target') {
                                    if (currentMission && currentMission.objective.type === 'HUNT' && currentMission.objective.targetId === enemy.id) {
                                        currentMission.status = 'COMPLETED';
                                        ship.dollars += currentMission.reward.dollars;
                                        ship.homingMissiles += currentMission.reward.homingMissiles || 0;
                                    }
                                    missionTargets = missionTargets.filter(x => x.id !== enemy.id);
                                }
                            }
                        }
                        projectileHit = true;
                        break;
                     }
                }
                if(projectileHit) { newProjectiles.splice(i,1); }
            }
            projectiles = newProjectiles;
            
            let newHomingMissiles = [...homingMissiles];
            for (let i = homingMissiles.length - 1; i >= 0; i--) {
                const hm = homingMissiles[i];
                const allTargets = [...asteroids, ...pirates, ...missionTargets];
                let missileHit = false;
                for (let j = allTargets.length - 1; j >= 0; j--) {
                    const a = allTargets[j];
                    if (Vec.distance(hm.position, a.position) < hm.radius + a.radius) {
                        a.health -= HOMING_MISSILE_DAMAGE;
                        if (a.health <= 0) {
                            if (a.type === 'asteroid') {
                                const droppedCrystal = Math.random() < ASTEROID_CRYSTAL_DROP_CHANCE;
                                explosions.push(createExplosion(a.position, a.radius, droppedCrystal ? 'rich' : 'dud'));
                                audioEngine.playSound('explosion');
                                for (let k = 0; k < Math.floor(a.radius / 4) + 3; k++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = Math.random() * 2 + 1;
                                    debris.push({
                                        id: `deb-${a.id}-${k}`, type: 'debris', position: { ...a.position },
                                        velocity: Vec.add(a.velocity, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }),
                                        radius: Math.random() * 4 + 2, life: 60 + Math.random() * 60,
                                        rotation: Math.random() * Math.PI * 2, rotationSpeed: Math.random() * 0.1 - 0.05,
                                    });
                                }
                                if (droppedCrystal) resources.push({ id: `res-${a.id}`, type: 'resource', position: a.position, velocity: a.velocity, radius: 5 });
                                asteroids = asteroids.filter(x => x.id !== a.id);
                            } else {
                                explosions.push(createExplosion(a.position, a.radius * 1.5, 'rich'));
                                audioEngine.playSound('explosion');
                                if (a.type === 'pirate') pirates = pirates.filter(x => x.id !== a.id);
                                else if (a.type === 'mission_target') {
                                    if (currentMission && currentMission.objective.type === 'HUNT' && currentMission.objective.targetId === a.id) {
                                        currentMission.status = 'COMPLETED';
                                        ship.dollars += currentMission.reward.dollars;
                                        ship.homingMissiles += currentMission.reward.homingMissiles || 0;
                                    }
                                    missionTargets = missionTargets.filter(x => x.id !== a.id);
                                }
                            }
                        }
                        missileHit = true;
                        break;
                    }
                }
                if (missileHit) newHomingMissiles.splice(i, 1);
            }
            homingMissiles = newHomingMissiles;
            
            if (ship.invulnerable <= 0) {
                let collisionOccurred = false;
                const celestialBodies = [star, ...planets];
                [...asteroids, ...celestialBodies, ...pirates, ...missionTargets].forEach(obj => {
                    if (Vec.distance(ship.position, obj.position) < ship.radius + obj.radius) {
                        ship.health -= obj.type === 'asteroid' ? 10 : (obj.type === 'pirate' || obj.type === 'mission_target' ? 20 : 50);
                        audioEngine.playSound('hit');
                        collisionOccurred = true;
                        if (obj.type === 'pirate' || obj.type === 'asteroid' || obj.type === 'mission_target') {
                            ship.velocity = Vec.scale(Vec.normalize(Vec.subtract(ship.position, obj.position)), 2);
                        }
                    }
                });
                for (const p of projectiles) {
                    if (p.type === 'enemy_projectile' && Vec.distance(ship.position, p.position) < ship.radius + p.radius) {
                        ship.health -= 15;
                        audioEngine.playSound('hit');
                        p.life = 0;
                        collisionOccurred = true;
                    }
                }
                 if (collisionOccurred) ship.invulnerable = SHIP_INVULNERABILITY_FRAMES;
            }

            const isCollidingWithGate = hyperspaceGate && Vec.distance(ship.position, hyperspaceGate.position) < ship.radius + hyperspaceGate.radius;
            if (isCollidingWithGate) {
                if (!gateActivatedRef.current) {
                    setMapOpen(true);
                    gateActivatedRef.current = true;
                }
            } else {
                gateActivatedRef.current = false;
            }

            for (let i = resources.length - 1; i >= 0; i--) {
                if (Vec.distance(ship.position, resources[i].position) < ship.radius + resources[i].radius) {
                    ship.resources += 1;
                    audioEngine.playSound('collect');
                    resources.splice(i, 1);
                    
                    if (currentMission && currentMission.status === 'IN_PROGRESS' && currentMission.objective.type === 'COLLECT') {
                        currentMission.objective.collected += 1;
                        if (currentMission.objective.collected >= currentMission.objective.amount) {
                            currentMission.status = 'COMPLETED';
                            ship.dollars += currentMission.reward.dollars;
                            ship.homingMissiles += currentMission.reward.homingMissiles || 0;
                        }
                    }
                }
            }
            for (let i = homingMissilePickups.length - 1; i >= 0; i--) {
                if (Vec.distance(ship.position, homingMissilePickups[i].position) < ship.radius + homingMissilePickups[i].radius) {
                    ship.homingMissiles += 1;
                    audioEngine.playSound('collect');
                    homingMissilePickups.splice(i, 1);
                }
            }

            let isGameOver = prev.isGameOver;
            if (ship.health <= 0) {
                audioEngine.playSound('error');
                isGameOver = true;
            }

            return {
                ...prev,
                ship,
                pirates,
                missionTargets,
                asteroids,
                projectiles: projectiles.filter(p => p.life-- > 0),
                homingMissiles: homingMissiles.filter(hm => hm.life-- > 0),
                resources,
                homingMissilePickups,
                explosions: explosions.filter(e => e.life-- > 0),
                debris: debris.filter(d => d.life > 0),
                planets,
                currentMission,
                isGameOver,
                gravity: gravityMagnitude,
            };
        });
        requestRef.current = requestAnimationFrame(gameLoop);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { 
            keysPressed.current[e.key] = true;
            const key = e.key.toLowerCase();
            if (key === 'e' && gameState.rangerStation) {
                if (Vec.distance(gameState.ship.position, gameState.rangerStation.position) < gameState.rangerStation.radius + 80) {
                    setGameState(prev => ({...prev, isStationMenuOpen: !prev.isStationMenuOpen}));
                }
            }
            if (key === 'escape') {
                if(isMapOpen) handleCloseMap();
                setGameState(prev => ({...prev, isStationMenuOpen: false}));
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
        const handleResize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('resize', handleResize);
        
        if (!isMapOpen && !gameState.isStationMenuOpen) {
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            if(requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameLoop, isMapOpen, gameState.isStationMenuOpen, gameState.ship.position, gameState.rangerStation]);

    const currentSystem = starMapData.systems.find(s => s.id === gameState.currentSystemId)!;

    const cameraScale = Math.max(0.3, 1 - Vec.magnitude(gameState.ship.velocity) / 20);
    const cameraOffset = {
        x: (gameState.ship.position.x * cameraScale - viewportSize.width / 2) / cameraScale,
        y: (gameState.ship.position.y * cameraScale - viewportSize.height / 2) / cameraScale
    };
    
    // Determine Nav Targets
    let primaryNavTarget: { position: Vector2D, label: string, color: string } | null = null;
    if (!gameState.isGameOver) {
        const { currentMission, currentSystemId, missionTargets, hyperspaceGate, rangerStation, ship } = gameState;

        if (currentMission?.status === 'IN_PROGRESS') {
            const { objective } = currentMission;
            if (objective.type === 'HUNT') {
                if (currentSystemId === objective.targetSystemId) {
                    const target = missionTargets.find(t => t.id === objective.targetId);
                    if (target) {
                        primaryNavTarget = { position: target.position, label: target.name, color: '#c936ff' };
                    }
                } else if (hyperspaceGate) {
                    // Mission target is in another system, guide to the gate
                    primaryNavTarget = { position: hyperspaceGate.position, label: t('navGate'), color: '#4a90e2' };
                }
            } else if (objective.type === 'COLLECT') {
                // For collect missions, guide to the station to turn it in, but only after collecting enough
                if (objective.collected >= objective.amount && rangerStation) {
                    primaryNavTarget = { position: rangerStation.position, label: rangerStation.name, color: '#22d3ee' };
                } else {
                     // Find the closest asteroid field or a rich area - for now, just find a nearby asteroid.
                    let closestAsteroid = null;
                    let minDistance = Infinity;
                    gameState.asteroids.forEach(a => {
                        const d = Vec.distance(ship.position, a.position);
                        if (d < minDistance) {
                            minDistance = d;
                            closestAsteroid = a;
                        }
                    });
                    if (closestAsteroid) {
                         primaryNavTarget = { position: closestAsteroid.position, label: t('navCrystal'), color: '#9ca3af' };
                    }
                }
            }
        } else {
            // No mission in progress, or mission is completed
            if (rangerStation) {
                // If there's a station, that's the primary point of interest
                primaryNavTarget = { position: rangerStation.position, label: rangerStation.name, color: '#22d3ee' };
            } else if (hyperspaceGate) {
                // If no station but there's a gate, guide to the gate
                primaryNavTarget = { position: hyperspaceGate.position, label: t('navGate'), color: '#4a90e2' };
            }
        }
    }

    const starNavTarget: { position: Vector2D, label: string, color: string } | null = useMemo(() => {
        if (gameState.isGameOver || !gameState.star) return null;
        return { position: gameState.star.position, label: t('navStar'), color: '#ffdf00' };
    }, [gameState.isGameOver, gameState.star, t]);


    const showInteractionPrompt = gameState.rangerStation && !gameState.isStationMenuOpen && Vec.distance(gameState.ship.position, gameState.rangerStation.position) < gameState.rangerStation.radius + 80;

    if (!gameState.gameStarted) {
        const skullAscii = `      :::::::::
    _::'        \`::_
  ,:'             \`:,
 /   ,d88b,   ,d88b,  \\
|   d8P  Y8   8P  Y8b   |
|   8P        8P        |
|   Y8b  d8   Y8b  d8   |
 \\   \`Y88P'   \`Y88P'   /
  \`,       _        ,\`
    \`::_,, d'b ,,::_'
      \`:::::::::'`;

        const bootSequence = [
            t('bootSeq1'), t('bootSeq2'), t('bootSeq3'), t('bootSeq4')
        ];

        return (
            <div className="cracktro-container font-vt323">
                <Starfield />
                <div className="scanlines"></div>
                
                 <div className="absolute top-4 right-4 z-20 text-green-400 text-lg">
                    <button onClick={() => setLang('en')} className={`px-2 ${lang === 'en' ? 'bg-green-400 text-black' : ''}`}>EN</button>
                    <span className="text-green-400">/</span>
                    <button onClick={() => setLang('ru')} className={`px-2 ${lang === 'ru' ? 'bg-green-400 text-black' : ''}`}>RU</button>
                </div>

                {splashPhase >= 1 && (
                    <div className="absolute top-10 left-0 w-full p-4 flex flex-col gap-2 text-lg">
                        {bootSequence.map((line, index) => (
                            <p key={index} className="boot-text" style={{ animation: `flicker-in ${0.5 + index * 0.5}s steps(2, start)`}}>{line}</p>
                        ))}
                    </div>
                )}

                <div className="flex flex-col items-center justify-center text-center z-10 p-4 absolute">
                    {splashPhase >= 2 && <pre className="ascii-art text-center mb-8">{skullAscii}</pre>}
                    
                    {splashPhase >= 3 && (
                        <h1 className="text-8xl font-black uppercase mb-2 text-slate-300" style={{ textShadow: '0 0 15px #60a5fa, 0 0 25px #60a5fa', animation: 'flicker-in 1.5s' }}>
                            SPACE DRIFTER
                        </h1>
                    )}

                    {splashPhase >= 4 && (
                        <div style={{animation: 'flicker-in 1s'}} className="mt-8 flex flex-col items-center">
                            <div className="flex flex-col items-start gap-y-2 max-w-2xl mx-auto text-left text-xl mb-8 text-green-400">
                                <div>{t('controlsSteer')}</div>
                                <div>{t('controlsBrake')}</div>
                                <div>{t('controlsLaser')}</div>
                                <div>{t('controlsMissile')}</div>
                                <div>{t('controlsJump', { cost: HYPERJUMP_COST })}</div>
                            </div>
                        
                            <button 
                                onClick={() => {
                                    audioEngine.stopMusic();
                                    audioEngine.playSound('confirm');
                                    setGameState(prev => ({...prev, gameStarted: true}));
                                }} 
                                className="text-4xl font-bold px-12 py-2 border-2 border-green-400 text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_#00ff00] animate-pulse"
                            >
                               {t('engageButton')}
                            </button>
                        </div>
                    )}
                </div>

                {splashPhase >= 3 && (
                    <div className="scroller-container text-2xl">
                        <p className="scroller-text">
                           {t('scrollerText')}
                        </p>
                    </div>
                )}
            </div>
        );
    }
    
    const currentMaxHealth = getMaxHealth(gameState.ship.hullLevel);
    const currentMaxAmmo = getMaxAmmo(gameState.ship.ammoCapLevel);

    return (
        <div className="w-screen h-screen overflow-hidden bg-black relative">
            <ParallaxBackground cameraOffset={cameraOffset} sector={currentSystem.level}/>
            {gameState.isJumping && <HyperspaceEffect />}
            
            {isMapOpen && (
                <StarMap
                    starMapData={starMapData}
                    currentSystemId={gameState.currentSystemId}
                    onJump={hyperJump}
                    onClose={handleCloseMap}
                    t={t}
                    targetSystemId={gameState.currentMission?.status === 'IN_PROGRESS' && gameState.currentMission?.objective.type === 'HUNT' ? gameState.currentMission.objective.targetSystemId : undefined}
                    shipResources={gameState.ship.resources}
                />
            )}
            
            {gameState.isStationMenuOpen && (
                <RangerStationMenu
                    ship={gameState.ship}
                    currentMission={gameState.currentMission}
                    onAccept={acceptMission}
                    onUpgrade={handleUpgrade}
                    onClose={() => setGameState(prev => ({...prev, isStationMenuOpen: false}))}
                    t={t}
                />
            )}

            <Hud 
                ship={gameState.ship} 
                systemName={currentSystem.name} 
                t={t}
                maxHealth={currentMaxHealth}
                maxAmmo={currentMaxAmmo}
                gravity={gameState.gravity}
            />
            <MissionDisplay mission={gameState.currentMission} ship={gameState.ship} t={t} />
            <Radar 
                ship={gameState.ship} 
                star={gameState.star} 
                planets={gameState.planets}
                asteroids={gameState.asteroids}
                resources={gameState.resources}
                hyperspaceGate={gameState.hyperspaceGate}
                t={t}
            />
            {starNavTarget && (
                 <NavArrow 
                    target={starNavTarget.position}
                    source={gameState.ship.position}
                    cameraScale={cameraScale}
                    viewportWidth={viewportSize.width}
                    viewportHeight={viewportSize.height}
                    color={starNavTarget.color}
                    label={starNavTarget.label}
                    isSecondary={true}
                />
            )}
            {primaryNavTarget && (
                 <NavArrow 
                    target={primaryNavTarget.position}
                    source={gameState.ship.position}
                    cameraScale={cameraScale}
                    viewportWidth={viewportSize.width}
                    viewportHeight={viewportSize.height}
                    color={primaryNavTarget.color}
                    label={primaryNavTarget.label}
                />
            )}


            <div className="absolute top-0 left-0" style={{ transform: `scale(${cameraScale}) translate(${-cameraOffset.x}px, ${-cameraOffset.y}px)`, transformOrigin: 'top left' }}>
                <div style={{ width: `${GAME_WORLD_SIZE}px`, height: `${GAME_WORLD_SIZE}px`, position: 'relative' }}>
                    <div className="absolute rounded-full star-core" style={{ left: gameState.star.position.x - gameState.star.radius, top: gameState.star.position.y - gameState.star.radius, width: gameState.star.radius * 2, height: gameState.star.radius * 2 }} />
                    {gameState.planets.map(p => {
                        const planetTypeClass = p.planetType === 'gas_giant' ? `planet-gas-giant-${p.variant}` : `planet-${p.planetType}`;
                        return (
                            <React.Fragment key={p.id}>
                                <div 
                                    className="planet-container" 
                                    style={{ 
                                        left: p.position.x - p.radius, 
                                        top: p.position.y - p.radius, 
                                        width: p.radius * 2, 
                                        height: p.radius * 2 
                                    }}
                                >
                                    {p.atmosphereColor && (
                                        <div 
                                            className="planet-atmosphere" 
                                            style={{
                                                boxShadow: `0 0 ${p.radius * 0.4}px ${p.radius * 0.15}px ${p.atmosphereColor}`
                                            }}
                                        />
                                    )}
                                    <div className={`planet-body ${planetTypeClass}`} />
                                    {p.hasRings && (
                                        <div 
                                            className="planet-rings"
                                            style={{
                                                borderWidth: `${Math.max(2, p.radius * 0.05)}px`
                                            }}
                                        />
                                    )}
                                </div>
                                {p.name && (
                                    <div
                                        className="absolute font-mono-retro"
                                        style={{
                                            left: p.position.x,
                                            top: p.position.y - p.radius - 14,
                                            transform: 'translateX(-50%)',
                                            color: 'rgba(200, 220, 255, 0.8)',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                            textShadow: '0 0 3px #000'
                                        }}
                                    >
                                        [{p.name}]
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {gameState.asteroids.map(a => <div key={a.id} className="absolute asteroid" style={{ left: a.position.x - a.radius, top: a.position.y - a.radius, width: a.radius * 2, height: a.radius * 2, transform: `rotate(${a.rotation}rad)` }} />)}
                    {gameState.debris.map(d => <div key={d.id} className="absolute debris" style={{ left: d.position.x - d.radius, top: d.position.y - d.radius, width: d.radius * 2, height: d.radius * 2, transform: `rotate(${d.rotation}rad)`, opacity: d.life / 60 }} />)}
                    {gameState.resources.map(r => <div key={r.id} className="absolute resource-crystal" style={{ left: r.position.x - r.radius, top: r.position.y - r.radius, width: r.radius * 2, height: r.radius * 2 }} />)}
                    {gameState.homingMissilePickups.map(p => <div key={p.id} className="absolute missile-pickup" style={{ left: p.position.x - p.radius, top: p.position.y - p.radius, width: p.radius * 2, height: p.radius * 2 }}> M </div>)}
                    {gameState.projectiles.map(p => <div key={p.id} className={'absolute projectile'} style={{ left: p.position.x - p.radius, top: p.position.y - p.radius, width: p.radius * 2, height: p.radius * 2, color: p.type === 'enemy_projectile' ? '#ff3636' : '#fff300', backgroundColor: 'currentColor' }} />)}
                    {gameState.homingMissiles.map(hm => <div key={hm.id} className="absolute" style={{ left: hm.position.x, top: hm.position.y, transform: `translate(-50%, -50%) rotate(${Math.atan2(hm.velocity.y, hm.velocity.x) + Math.PI/2}rad)`}}><div className="homing-missile" /></div>)}
                    {gameState.explosions.map(e => <div key={e.id} className={`explosion-base explosion-${e.explosionType}`} style={{ left: e.position.x, top: e.position.y, width: e.radius * 2 * (1 - e.life/20), height: e.radius * 2 * (1-e.life/20), opacity: e.life/10 }} />)}
                    {gameState.pirates.map(p => <div key={p.id} className="absolute" style={{ left: p.position.x, top: p.position.y, transform: `translate(-50%, -50%) rotate(${p.angle + Math.PI/2}rad)`}}><div className="pirate-triangle"></div></div>)}
                    {gameState.missionTargets.map(p => <div key={p.id} className="absolute" style={{ left: p.position.x, top: p.position.y, transform: `translate(-50%, -50%) rotate(${p.angle + Math.PI/2}rad)`}}><div title={p.name} className="mission-target-triangle"></div></div>)}
                    
                    {gameState.rangerStation && (
                        <div className="ranger-station-v2" style={{ left: gameState.rangerStation.position.x, top: gameState.rangerStation.position.y, width: gameState.rangerStation.radius * 2, height: gameState.rangerStation.radius * 2 }}>
                            <div className="ranger-station-v2-arm arm1" />
                            <div className="ranger-station-v2-arm arm2" />
                            <div className="ranger-station-v2-arm arm3" />
                            <div className="ranger-station-v2-core" />
                        </div>
                    )}

                    {gameState.hyperspaceGate && (
                        <div className="absolute hyperspace-gate" style={{ left: gameState.hyperspaceGate.position.x, top: gameState.hyperspaceGate.position.y, width: gameState.hyperspaceGate.radius * 2, height: gameState.hyperspaceGate.radius * 2 }} />
                    )}


                    <div className="absolute" style={{ left: gameState.ship.position.x, top: gameState.ship.position.y, transform: `translate(-50%, -50%) rotate(${gameState.ship.angle + Math.PI/2}rad)`, opacity: gameState.ship.invulnerable > 0 && Math.floor(gameState.ship.invulnerable / 10) % 2 === 0 ? 0.5 : 1, }}>
                        <div className="ship-triangle"></div>
                        {gameState.ship.isThrusting && <div className="ship-thrust"></div>}
                    </div>
                </div>
            </div>

            {showInteractionPrompt && (
                <div className="interaction-prompt fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white font-mono-retro p-4 rounded-md border border-slate-500 z-50">
                    {t('promptDockStation')}
                </div>
            )}


            {gameState.isGameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 font-vt323">
                    <div className="scanlines"></div>
                    <h2 className="text-8xl font-black text-orange-500 mb-4 glitch-text" style={{textShadow: '0 0 10px #ff0000'}}>{t('gameOverTitle')}</h2>
                    <p className="text-4xl mb-2 text-orange-300">{t('gameOverLocation', { sector: currentSystem.name })}</p>
                    <p className="text-2xl mb-8 text-orange-400">{t('gameOverReason')}</p>
                    <button onClick={restartGame} className="text-4xl font-bold px-12 py-2 border-2 border-green-400 text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_#00ff00] animate-pulse">
                        {t('gameOverRestart')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
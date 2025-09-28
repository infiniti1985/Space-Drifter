import React from 'react';
import type { Ship } from '../types';
import { HYPERJUMP_COST, MAX_GRAVITY_FOR_HUD } from '../constants';

interface HudProps {
  ship: Ship;
  systemName: string;
  t: (key: string, params?: any) => string;
  maxHealth: number;
  maxAmmo: number;
  gravity: number;
}

const HudBar: React.FC<{ value: number; maxValue: number; color: string; label: string }> = ({ value, maxValue, color, label }) => {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="w-48">
      <span className="text-sm uppercase tracking-widest">{label}</span>
      <div className="w-full bg-gray-700 h-4 mt-1 border border-gray-500">
        <div className={`${color} h-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const Hud: React.FC<HudProps> = ({ ship, systemName, t, maxHealth, maxAmmo, gravity }) => {
  const canJump = ship.resources >= HYPERJUMP_COST;

  const getGravityColor = (value: number, maxValue: number): string => {
    const percentage = value / maxValue;
    if (percentage > 0.8) return 'bg-red-500 animate-pulse';
    if (percentage > 0.5) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const gravityPercentage = Math.min(100, (gravity / MAX_GRAVITY_FOR_HUD) * 100);

  return (
    <>
      <div className="font-mono-retro fixed top-0 left-0 right-0 p-4 flex justify-between items-start text-white pointer-events-none z-50">
        <div className="flex flex-col gap-2">
          <HudBar value={ship.health} maxValue={maxHealth} color="bg-green-500" label={t('hudHull')} />
          <HudBar value={ship.ammo} maxValue={maxAmmo} color="bg-yellow-500" label={t('hudAmmo')} />
          <div>
            <span className="text-sm uppercase tracking-widest">{t('hudMissiles')}</span>
            <p className="text-xl">{ship.homingMissiles}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl uppercase tracking-wider">{systemName}</div>
          <p className="text-sm uppercase tracking-widest mt-2">{t('hudFireMissile')}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div>
            <span className="text-sm uppercase tracking-widest">{t('hudDollars')}</span>
            <p className="text-xl">{ship.dollars}$</p>
          </div>
          <div>
            <span className="text-sm uppercase tracking-widest">{t('hudCrystals')}</span>
            <p className="text-xl">{ship.resources} / {HYPERJUMP_COST}</p>
          </div>
          <div className={`mt-2 p-2 border ${canJump ? 'border-orange-400 text-orange-400 animate-pulse' : 'border-gray-600 text-gray-600'}`}>
            <p className="uppercase tracking-widest">{t('hudHyperspace')}</p>
            <p>{canJump ? t('hudJumpReady') : t('hudJumpCharging', { cost: HYPERJUMP_COST })}</p>
          </div>
        </div>
      </div>
      
      {/* Gravity Bar at the bottom */}
      <div className="font-mono-retro fixed bottom-4 left-1/2 -translate-x-1/2 w-1/2 flex flex-col items-center pointer-events-none z-50 text-white">
        <span className="text-sm uppercase tracking-widest">{t('hudGravity')}</span>
        <div className="w-full bg-gray-700 h-3 mt-1 border border-gray-500">
            <div 
                className={`${getGravityColor(gravity, MAX_GRAVITY_FOR_HUD)} h-full transition-all duration-150 ease-linear`} 
                style={{ width: `${gravityPercentage}%` }}
            ></div>
        </div>
      </div>
    </>
  );
};

export default Hud;
import React, { useState } from 'react';
import type { Mission, Ship, UpgradeType } from '../types';
import { upgradesConfig } from '../services/upgrades';
import { getAvailableMissions } from '../services/missionGenerator';

interface RangerStationMenuProps {
    ship: Ship;
    currentMission: Mission | null;
    onAccept: (mission: Mission) => void;
    onUpgrade: (upgradeType: UpgradeType) => void;
    onClose: () => void;
    t: (key: string, params?: any) => string;
}

const RangerStationMenu: React.FC<RangerStationMenuProps> = ({ ship, currentMission, onAccept, onUpgrade, onClose, t }) => {
    const [activeTab, setActiveTab] = useState<'contracts' | 'upgrades'>('contracts');
    const availableMissions = getAvailableMissions(t);

    const getObjectiveText = (mission: Mission) => {
      if (mission.objective.type === 'HUNT') {
          return t('missionObjectiveDestroy', { targetName: mission.objective.targetName });
      }
      if (mission.objective.type === 'COLLECT') {
          return t('missionObjectiveCollect', { collected: mission.objective.collected, amount: mission.objective.amount });
      }
      return '';
    }

    const getRewardText = (reward: Mission['reward']) => {
        if (reward.homingMissiles && reward.homingMissiles > 0) {
            return t('missionReward', { dollars: reward.dollars, missiles: reward.homingMissiles });
        }
        return t('missionRewardDollarsOnly', { dollars: reward.dollars });
    }

    const getUpgradeLevel = (type: UpgradeType) => {
        switch(type) {
            case 'hull': return ship.hullLevel;
            case 'engine': return ship.engineLevel;
            case 'weapon': return ship.weaponLevel;
            case 'ammoCap': return ship.ammoCapLevel;
            case 'magnet': return ship.magnetLevel;
            default: return 1;
        }
    };

    const upgradeDetails: {id: UpgradeType, nameKey: string, descKey: string}[] = [
        { id: 'hull', nameKey: 'upgradeHullName', descKey: 'upgradeHullDesc' },
        { id: 'engine', nameKey: 'upgradeEngineName', descKey: 'upgradeEngineDesc' },
        { id: 'weapon', nameKey: 'upgradeWeaponName', descKey: 'upgradeWeaponDesc' },
        { id: 'ammoCap', nameKey: 'upgradeAmmoCapName', descKey: 'upgradeAmmoCapDesc' },
        { id: 'magnet', nameKey: 'upgradeMagnetName', descKey: 'upgradeMagnetDesc' },
    ];

    return (
        <div className="font-mono-retro fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100]" onClick={onClose}>
            <div 
                className="w-[90vw] max-w-3xl bg-[#020010] border-2 border-slate-600 p-6 flex flex-col text-slate-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-3xl text-orange-400 uppercase tracking-widest mb-4">{t('stationMenuTitle')}</h2>
                
                <div className="flex border-b-2 border-slate-700 mb-4">
                    <button 
                        className={`px-4 py-2 text-xl transition-colors ${activeTab === 'contracts' ? 'text-orange-400 border-b-2 border-orange-400 -mb-px' : 'text-slate-500'}`}
                        onClick={() => setActiveTab('contracts')}
                    >{t('stationTabContracts')}</button>
                    <button
                        className={`px-4 py-2 text-xl transition-colors ${activeTab === 'upgrades' ? 'text-orange-400 border-b-2 border-orange-400 -mb-px' : 'text-slate-500'}`}
                        onClick={() => setActiveTab('upgrades')}
                    >{t('stationTabUpgrades')}</button>
                     <div className="flex-grow"></div>
                     <div className="px-4 py-2 text-xl text-cyan-400">
                         {t('hudDollars')}: {ship.dollars}$
                     </div>
                </div>

                {activeTab === 'contracts' && (
                    <div className="h-96 overflow-y-auto pr-2">
                        {currentMission ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-xl text-slate-400">{t('missionIncoming')}:</p>
                                <p className="text-2xl text-white my-4">"{currentMission.title}"</p>
                                <p className="text-lg text-orange-400">{getObjectiveText(currentMission)}</p>
                            </div>
                        ) : (
                        <>
                            <p className="text-slate-400 mb-6">{t('stationMenuDesc')}</p>
                            <div className="space-y-4">
                            {availableMissions.map(mission => (
                                <div key={mission.id} className="border border-slate-700 p-4 bg-black bg-opacity-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl text-white">{mission.title}</h3>
                                        <p className="text-base mb-2 italic text-slate-400 max-w-md">{mission.description}</p>
                                        <p className="text-lg"><span className="text-orange-400 uppercase">{getObjectiveText(mission)}</span></p>
                                        <p className="text-lg"><span className="text-green-400 uppercase">{getRewardText(mission.reward)}</span></p>
                                    </div>
                                    <button
                                        onClick={() => onAccept(mission)}
                                        className="text-xl h-fit font-bold px-8 py-2 border-2 border-green-400 text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_#00ff00] animate-pulse"
                                    >
                                        {t('missionAccept')}
                                    </button>
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                    </div>
                )}
                
                {activeTab === 'upgrades' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96 overflow-y-auto pr-2">
                        {upgradeDetails.map(detail => {
                            const config = upgradesConfig[detail.id];
                            const currentLevel = getUpgradeLevel(detail.id);
                            const isMaxLevel = currentLevel >= config.maxLevel;
                            const cost = isMaxLevel ? 0 : config.getCost(currentLevel);
                            const canAfford = ship.dollars >= cost;

                            return (
                                <div key={detail.id} className="border border-slate-700 p-4 bg-black bg-opacity-50 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-xl text-white">{t(detail.nameKey)}</h4>
                                            <span className="text-sm text-slate-400">{t('upgradeLevel', {current: currentLevel, max: config.maxLevel})}</span>
                                        </div>
                                        <p className="text-sm italic text-slate-400 mt-1 mb-3 h-10">{t(detail.descKey)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-lg text-green-400">
                                            {!isMaxLevel ? t('upgradeCost', { cost: cost }) : t('upgradeMaxLevel')}
                                        </span>
                                        <button 
                                            onClick={() => onUpgrade(detail.id)}
                                            disabled={isMaxLevel || !canAfford}
                                            className="px-4 py-1 border-2 border-green-400 text-green-400 transition-all duration-300 enabled:hover:bg-green-400 enabled:hover:text-black enabled:hover:shadow-[0_0_10px_#00ff00] disabled:border-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed"
                                        >
                                            {t('upgradeButton')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button onClick={onClose} className="absolute top-2 right-3 text-3xl text-slate-400 hover:text-white">&times;</button>
            </div>
        </div>
    );
};

export default RangerStationMenu;
import React, { useState, useMemo, useEffect } from 'react';
import type { StarMapData } from '../types';
import { HYPERJUMP_COST } from '../constants';

interface StarMapProps {
    starMapData: StarMapData;
    currentSystemId: string;
    onJump: (targetSystemId: string) => void;
    onClose: () => void;
    t: (key: string, params?: any) => string;
    targetSystemId?: string;
    shipResources: number;
}

const StarMap: React.FC<StarMapProps> = ({ starMapData, currentSystemId, onJump, onClose, t, targetSystemId, shipResources }) => {
    const [selectedSystemId, setSelectedSystemId] = useState<string | null>(targetSystemId || null);

    useEffect(() => {
        // Pre-select the target system if it's provided
        if(targetSystemId) {
            setSelectedSystemId(targetSystemId);
        }
    }, [targetSystemId]);

    const reachableSystemIds = useMemo(() => {
        // If a specific mission target is provided, only that system is "reachable"
        if (targetSystemId) {
            const connected = new Set<string>();
            starMapData.connections.forEach(([a, b]) => {
                if ((a === currentSystemId && b === targetSystemId) || (b === currentSystemId && a === targetSystemId)) {
                    connected.add(targetSystemId);
                }
            });
            return connected;
        }
        // Fallback for "free roam" jump capability to any adjacent system
        const connected = new Set<string>();
        starMapData.connections.forEach(([a, b]) => {
            if (a === currentSystemId) connected.add(b);
            if (b === currentSystemId) connected.add(a);
        });
        return connected;
    }, [currentSystemId, starMapData.connections, targetSystemId]);

    const selectedSystem = starMapData.systems.find(s => s.id === selectedSystemId);
    const canAffordJump = shipResources >= HYPERJUMP_COST;
    
    const handleJump = () => {
        if (selectedSystemId && canAffordJump) {
            onJump(selectedSystemId);
        }
    };

    return (
        <div className="font-mono-retro fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100]" onClick={onClose}>
            <div 
                className="w-[90vw] h-[90vh] max-w-4xl max-h-[700px] bg-[#020010] border-2 border-slate-600 p-4 flex text-slate-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-2/3 h-full relative border-r border-slate-700 pr-4">
                    <h2 className="text-2xl text-orange-400 uppercase tracking-widest mb-4">{t('mapTitle')}</h2>
                    <div className="w-full h-[calc(100%-40px)] bg-black bg-opacity-40 relative overflow-hidden">
                        {/* Connections */}
                        {starMapData.connections.map(([a, b], i) => {
                            const systemA = starMapData.systems.find(s => s.id === a);
                            const systemB = starMapData.systems.find(s => s.id === b);
                            if (!systemA || !systemB) return null;
                            const isReachable = (a === currentSystemId && reachableSystemIds.has(b)) || (b === currentSystemId && reachableSystemIds.has(a));
                            const color = isReachable ? 'rgba(96, 165, 250, 0.6)' : 'rgba(100, 116, 139, 0.4)';

                            const angle = Math.atan2(systemB.position.y - systemA.position.y, systemB.position.x - systemA.position.x);
                            const distance = Math.sqrt(Math.pow(systemB.position.x - systemA.position.x, 2) + Math.pow(systemB.position.y - systemA.position.y, 2));
                            
                            return (
                                <div key={`conn-${i}`} className="absolute" style={{
                                    left: systemA.position.x,
                                    top: systemA.position.y,
                                    width: distance,
                                    height: '1px',
                                    backgroundColor: color,
                                    transformOrigin: 'top left',
                                    transform: `rotate(${angle}rad)`,
                                }} />
                            );
                        })}
                        {/* Systems */}
                        {starMapData.systems.map(system => {
                            const isCurrent = system.id === currentSystemId;
                            const isReachable = reachableSystemIds.has(system.id);
                            const isSelected = system.id === selectedSystemId;
                            
                            let bgColor = 'bg-slate-500';
                            let size = 'w-3 h-3';
                            let pulse = '';

                            if (isCurrent) {
                                bgColor = 'bg-green-500';
                                size = 'w-4 h-4';
                                pulse = 'animate-pulse';
                            } else if (isReachable) {
                                bgColor = 'bg-blue-400';
                            }
                            
                            return (
                                <div
                                    key={system.id}
                                    title={system.name}
                                    className={`absolute rounded-full transition-all ${size} ${bgColor} ${pulse} ${isSelected ? 'ring-2 ring-orange-400' : ''} ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
                                    style={{ left: system.position.x - 6, top: system.position.y - 6 }}
                                    onClick={() => isReachable && setSelectedSystemId(system.id)}
                                >
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">{system.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="w-1/3 h-full pl-4 flex flex-col">
                    <h3 className="text-xl text-orange-400 uppercase tracking-widest mb-4">{t('mapSystemInfo')}</h3>
                    {selectedSystem ? (
                        <div className="flex-grow flex flex-col justify-between">
                            <div>
                                <p className="text-2xl text-white">{selectedSystem.name}</p>
                                <p className="text-slate-400 mb-4">{t('mapThreatLevel', { level: selectedSystem.level })}</p>
                                <p className="text-sm italic">{selectedSystem.description}</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-lg mb-2 ${canAffordJump ? 'text-green-400' : 'text-red-500'}`}>
                                    {t('mapJumpCost', { cost: HYPERJUMP_COST })}
                                </p>
                                <button
                                    onClick={handleJump}
                                    disabled={!selectedSystemId || selectedSystemId === currentSystemId || !canAffordJump}
                                    className="text-2xl font-bold px-8 py-2 border-2 border-green-400 text-green-400 transition-all duration-300 enabled:hover:bg-green-400 enabled:hover:text-black enabled:hover:shadow-[0_0_20px_#00ff00] enabled:animate-pulse disabled:border-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    {canAffordJump ? t('mapJumpButton') : t('mapJumpInsufficient')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400">{targetSystemId ? t('mapSelectSystem') : t('mapSelectAdjacent')}</p>
                    )}
                </div>
                <button onClick={onClose} className="absolute top-2 right-3 text-2xl text-slate-400 hover:text-white">&times;</button>
            </div>
        </div>
    );
};

export default StarMap;
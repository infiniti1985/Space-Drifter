import type { Mission } from '../types';

export const getAvailableMissions = (t: (key: string, params?: any) => string): Mission[] => {
    return [
        {
            id: `mission-bounty-widow-${Date.now()}`,
            title: t('missionTitleBounty'),
            description: t('missionDescBounty'),
            objective: {
                type: 'HUNT',
                targetName: 'Thanaia "Black Widow" Volt',
                targetId: `mission-target-widow`,
                targetSystemId: 'tau-ceti',
            },
            reward: {
                dollars: 250,
                homingMissiles: 2,
            },
            status: 'IN_PROGRESS', // Status will be set on acceptance
        },
        {
            id: `mission-collect-crystals-${Date.now()}`,
            title: t('missionTitleCollect'),
            description: t('missionDescCollect'),
            objective: {
                type: 'COLLECT',
                amount: 10,
                collected: 0,
            },
            reward: {
                dollars: 100,
                homingMissiles: 1,
            },
            status: 'IN_PROGRESS',
        }
    ];
};
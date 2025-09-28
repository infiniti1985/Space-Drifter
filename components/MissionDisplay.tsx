import React, { useState, useEffect } from 'react';
import type { Mission, Ship } from '../types';

interface MissionDisplayProps {
  mission: Mission | null;
  ship: Ship;
  t: (key: string, params?: any) => string;
}

const MissionDisplay: React.FC<MissionDisplayProps> = ({ mission, ship, t }) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedMission, setCompletedMission] = useState<Mission | null>(null);

  useEffect(() => {
    if (mission?.status === 'COMPLETED' && mission.id !== completedMission?.id) {
        setCompletedMission(mission);
        setShowCompletion(true);
        const timer = setTimeout(() => {
            setShowCompletion(false);
        }, 3000); // Show completion message for 3 seconds
        return () => clearTimeout(timer);
    }
  }, [mission, completedMission]);

    const getRewardText = (reward: Mission['reward']) => {
        if (reward.homingMissiles && reward.homingMissiles > 0) {
            return t('missionReward', { dollars: reward.dollars, missiles: reward.homingMissiles });
        }
        return t('missionRewardDollarsOnly', { dollars: reward.dollars });
    }

  if (showCompletion && completedMission) {
    return (
        <div className="mission-complete fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-slate-800 border-2 border-orange-500 text-orange-300 text-center z-50 font-mono-retro shadow-lg">
            <h3 className="text-xl font-bold uppercase tracking-widest">{t('missionCompleteTitle')}</h3>
            <p className="text-lg">{getRewardText(completedMission.reward)}</p>
        </div>
    )
  }

  if (!mission || mission.status === 'COMPLETED') {
    return null;
  }
  
  const getObjectiveText = () => {
      if (mission.objective.type === 'HUNT') {
          return t('missionObjectiveDestroy', { targetName: mission.objective.targetName });
      }
      if (mission.objective.type === 'COLLECT') {
          return t('missionObjectiveCollect', { collected: mission.objective.collected, amount: mission.objective.amount });
      }
      return '';
  }

  return (
    <div className="fixed top-4 right-4 w-full max-w-sm p-4 bg-black bg-opacity-60 border-2 border-slate-600 text-slate-300 z-50 font-mono-retro">
      <h3 className="text-lg font-bold uppercase tracking-widest text-orange-400">{t('missionIncoming')}</h3>
      <p className="italic my-2 text-white">"{mission.title}"</p>
      <p className="text-sm mb-3">{mission.description}</p>
      <div className="h-px bg-slate-700 my-2"></div>
      <p className="font-bold text-base text-orange-400">{getObjectiveText()}</p>
    </div>
  );
};

export default MissionDisplay;

import type { Mission } from '@/lib/data';
import { missionData } from '@/lib/data';

export async function getMissions(): Promise<Mission[]> {
  return Promise.resolve(missionData);
}

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const newMission: Mission = { 
        id: `MIS${Math.floor(Math.random() * 1000)}`, 
        ...missionDataToAdd 
    };
    missionData.push(newMission);
    return Promise.resolve(newMission);
}

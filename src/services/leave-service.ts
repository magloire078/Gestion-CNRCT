
import type { Leave } from '@/lib/data';
import { leaveData } from '@/lib/data';

export async function getLeaves(): Promise<Leave[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(leaveData);
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeave: Leave = { 
        id: `LVE${Math.floor(Math.random() * 1000)}`, 
        status: 'Pending',
        ...leaveDataToAdd 
    };
    leaveData.push(newLeave);
    return Promise.resolve(newLeave);
}

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
    const leave = leaveData.find(l => l.id === id);
    if (leave) {
        leave.status = status;
    }
    return Promise.resolve();
}

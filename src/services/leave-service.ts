
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Leave } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// --- Mock Data ---
let mockLeaves: Leave[] = [
  { id: '1', employee: 'Koffi Jean-Luc', type: 'Congé Annuel', startDate: '2024-08-01', endDate: '2024-08-15', status: 'Approuvé' },
  { id: '2', employee: 'Amoin Thérèse', type: 'Congé Maladie', startDate: '2024-07-20', endDate: '2024-07-22', status: 'Approuvé' },
  { id: '3', employee: 'Brou Adjoua', type: 'Congé Personnel', startDate: '2024-09-01', endDate: '2024-09-02', status: 'En attente' },
];
// --- End Mock Data ---

export function subscribeToLeaves(
    callback: (leaves: Leave[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => {
        // Return a copy to prevent direct mutation of the mock data
        callback([...mockLeaves]);
    }, 1000);

    return () => clearInterval(interval);
}

export async function getLeaves(): Promise<Leave[]> {
  return Promise.resolve([...mockLeaves]);
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeave: Leave = { 
        id: `leave-${Date.now()}`, 
        status: 'En attente',
        ...leaveDataToAdd
    };
    mockLeaves.push(newLeave);
    return Promise.resolve(newLeave);
}

export async function updateLeaveStatus(id: string, status: 'Approuvé' | 'Rejeté'): Promise<void> {
    const leave = mockLeaves.find(l => l.id === id);
    if (leave) {
        leave.status = status;
    }
    return Promise.resolve();
}


import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Conflict } from '@/lib/data';
// import { db } from '@/lib/firebase';

// --- Mock Data ---
const mockConflicts: Conflict[] = [
    { id: '1', village: 'Gagnoa', description: 'Conflit foncier entre deux familles.', reportedDate: '2023-05-10', status: 'En cours' },
    { id: '2', village: 'Man', description: 'Dispute sur les limites du village.', reportedDate: '2023-04-22', status: 'En médiation' },
    { id: '3', village: 'Korhogo', description: 'Accès à un point d\'eau commun.', reportedDate: '2023-03-15', status: 'Résolu' },
];
// --- End Mock Data ---


export function subscribeToConflicts(
    callback: (conflicts: Conflict[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockConflicts), 5000);
    return () => clearInterval(interval);
}

export async function getConflicts(): Promise<Conflict[]> {
  return Promise.resolve(mockConflicts);
}

export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    const newConflict: Conflict = { 
        id: `conflict-${Date.now()}`, 
        ...conflictDataToAdd 
    };
    mockConflicts.push(newConflict);
    return Promise.resolve(newConflict);
}


import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Supply } from '@/lib/data';

// --- Mock Data ---
const mockSupplies: Supply[] = [
    { id: '1', name: 'Rame de papier A4', category: 'Papeterie', quantity: 50, reorderLevel: 20, lastRestockDate: '2024-07-01' },
    { id: '2', name: 'Cartouche HP 305XL Noir', category: 'Cartouches d\'encre', quantity: 5, reorderLevel: 10, lastRestockDate: '2024-06-15' },
    { id: '3', name: 'Stylo BIC Bleu', category: 'Papeterie', quantity: 200, reorderLevel: 50, lastRestockDate: '2024-07-10' },
    { id: '4', name: 'Nettoyant multi-surfaces', category: 'Matériel de nettoyage', quantity: 12, reorderLevel: 5, lastRestockDate: '2024-07-20' },
];
// --- End Mock Data ---


export function subscribeToSupplies(
    callback: (supplies: Supply[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockSupplies), 5000);
    return () => clearInterval(interval);
}

export async function getSupplies(): Promise<Supply[]> {
    return Promise.resolve(mockSupplies);
}

export async function addSupply(supplyDataToAdd: Omit<Supply, 'id'>): Promise<Supply> {
    const newSupply: Supply = { 
        id: `supply-${Date.now()}`, 
        ...supplyDataToAdd 
    };
    mockSupplies.push(newSupply);
    return Promise.resolve(newSupply);
}

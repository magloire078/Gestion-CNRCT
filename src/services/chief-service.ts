
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Chief } from '@/lib/data';
// import { db } from '@/lib/firebase';

// --- Mock Data ---
const mockChiefs: Chief[] = [
    { id: '1', name: 'Nanan Kouakou Anougblé III', title: 'Roi des Baoulé', role: 'Roi', region: 'Gbêkê', department: 'Sakassou', subPrefecture: 'Sakassou', village: 'Sakassou', contact: '+225 0102030405', bio: 'Roi du royaume Baoulé depuis 1993.', photoUrl: 'https://placehold.co/100x100.png', latitude: 7.6833, longitude: -5.2833 },
    { id: '2', name: 'Sa Majesté Amon N\'Douffou V', title: 'Roi du Sanwi', role: 'Roi', region: 'Sud-Comoé', department: 'Aboisso', subPrefecture: 'Aboisso', village: 'Krindjabo', contact: '+225 0203040506', bio: 'Gardien des traditions Agni.', photoUrl: 'https://placehold.co/100x100.png', latitude: 5.485, longitude: -3.208 },
    { id: '3', name: 'Chef N\'Guessan Koffi', title: 'Chef de village de Konankro', role: 'Chef de Village', region: 'District Autonome de Yamoussoukro', department: 'Yamoussoukro', subPrefecture: 'Yamoussoukro', village: 'Konankro', contact: '+225 0304050607', bio: 'Chef du village de Konankro.', photoUrl: 'https://placehold.co/100x100.png', latitude: 6.82055, longitude: -5.2767 },
    { id: '4', name: 'Chef Kanté Amadou', title: 'Chef de canton de Boundiali', role: 'Chef de Canton', region: 'Poro', department: 'Korhogo', subPrefecture: 'Korhogo', village: 'Boundiali', contact: '+225 0405060708', bio: '', photoUrl: 'https://placehold.co/100x100.png', latitude: 9.5167, longitude: -6.4833 }
];
// --- End Mock Data ---


export function subscribeToChiefs(
    callback: (chiefs: Chief[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockChiefs), 5000);
    return () => clearInterval(interval);
}

export async function getChiefs(): Promise<Chief[]> {
    return Promise.resolve(mockChiefs);
}

export async function addChief(chiefData: Omit<Chief, 'id'>): Promise<Chief> {
    const newChief: Chief = {
        id: `chief-${Date.now()}`,
        ...chiefData
    };
    mockChiefs.push(newChief);
    return Promise.resolve(newChief);
}

export async function deleteChief(id: string): Promise<void> {
    const index = mockChiefs.findIndex(c => c.id === id);
    if (index > -1) {
        mockChiefs.splice(index, 1);
    }
    return Promise.resolve();
}

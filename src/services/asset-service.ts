
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Asset } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// --- Mock Data ---
const mockAssets: Asset[] = [
  { tag: 'IT-LAP-1678886400', type: 'Ordinateur portable', model: 'Dell Latitude 7490', assignedTo: 'Jean Dupont', status: 'En Utilisation' },
  { tag: 'IT-MON-1678886500', type: 'Moniteur', model: 'Dell U2721DE', assignedTo: 'Jean Dupont', status: 'En Utilisation' },
  { tag: 'IT-LAP-1678886600', type: 'Ordinateur portable', model: 'Apple MacBook Pro 16"', assignedTo: 'Marie Curie', status: 'Actif' },
  { tag: 'IT-SFW-1678886700', type: 'Logiciel', model: 'Microsoft Office 365', assignedTo: 'Tous les employés', status: 'Actif' },
  { tag: 'IT-LAP-1678886800', type: 'Ordinateur portable', model: 'HP EliteBook 840', assignedTo: 'En Stock', status: 'En Stock' },
];
// --- End Mock Data ---


export function subscribeToAssets(
    callback: (assets: Asset[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    // Simulate real-time updates for mock data
    const interval = setInterval(() => {
        callback(mockAssets);
    }, 5000); // Re-send the data every 5s to mimic onSnapshot

    // The returned function will be called to "unsubscribe"
    return () => clearInterval(interval);
}

export async function getAssets(): Promise<Asset[]> {
  // Return mock data instead of fetching from Firestore
  return Promise.resolve(mockAssets);
}

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'> & { tag?: string }): Promise<Asset> {
    const newTag = `IT-NEW-${Date.now()}`;
    const newAsset: Asset = { 
        tag: newTag, 
        ...assetDataToAdd
    };
    mockAssets.push(newAsset);
    return Promise.resolve(newAsset);
}

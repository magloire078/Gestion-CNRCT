import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where, setDoc, limit } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { Village } from '@/types/village';
import { FirestorePermissionError } from '@/lib/errors';
import { DEFAULT_QUERY_LIMIT } from '@/lib/firestore-utils';

const villagesCollection = collection(db, 'villages');

/**
 * Calculates the Local Development Index (IDL) for a village.
 * The score is based on key infrastructure availability with specific weighting.
 * Base (80%): Water (20%), Health (20%), Electricity (20%), Education (20%)
 * Economic/Social (20%): Market (10%), Spiritual/Social (10% for Mosque OR Church)
 */
export const calculateDevelopmentScore = (village: Partial<Village>): number => {
    let score = 0;
    
    // Core infrastructure (80 points total)
    if (village.hasSchool) score += 20;
    if (village.hasHealthCenter) score += 20;
    if (village.hasElectricity) score += 20;
    if (village.hasWater) score += 20;
    
    // Economic & Social (20 points total)
    if (village.hasMarket) score += 10;
    
    // Spiritual/Social gathering points (either counts)
    if (village.hasMosque || village.hasChurch) score += 10;
    
    return score;
};

export async function getVillages(): Promise<Village[]> {
    const snapshot = await getDocs(query(villagesCollection, orderBy("name", "asc"), limit(DEFAULT_QUERY_LIMIT)));
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Village));
}

export async function getVillage(id: string): Promise<Village | null> {
    if (!id) return null;
    const docRef = doc(db, 'villages', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Village;
    }
    return null;
}

export async function getVillageByLocation(region: string, department: string, subPrefecture: string, villageName: string): Promise<Village | null> {
    const q = query(villagesCollection,
        where('region', '==', region),
        where('department', '==', department),
        where('subPrefecture', '==', subPrefecture),
        where('name', '==', villageName)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Village;
    }
    return null;
}

export async function addVillage(villageData: Omit<Village, 'id'>): Promise<Village> {
    // Check for existing village with same coordinates admin
    const existing = await getVillageByLocation(
        villageData.region,
        villageData.department,
        villageData.subPrefecture,
        villageData.name
    );

    if (existing) {
        throw new Error(`La localité de ${villageData.name} est déjà répertoriée dans la sous-préfecture de ${villageData.subPrefecture}.`);
    }

    const now = new Date().toISOString();
    const dataWithAudit = {
        ...villageData,
        createdAt: now,
        updatedAt: now,
        developmentScore: calculateDevelopmentScore(villageData)
    };

    const docRef = await addDoc(villagesCollection, dataWithAudit);
    return { id: docRef.id, ...dataWithAudit } as Village;
}

export async function updateVillage(id: string, villageData: Partial<Omit<Village, 'id'>>): Promise<void> {
    const docRef = doc(db, 'villages', id);
    try {
        const dataToUpdate = {
            ...villageData,
            updatedAt: new Date().toISOString()
        };

        // Recalculer le score si une infrastructure a changé
        if (
            villageData.hasWater !== undefined || 
            villageData.hasElectricity !== undefined || 
            villageData.hasHealthCenter !== undefined || 
            villageData.hasSchool !== undefined ||
            villageData.hasMarket !== undefined ||
            villageData.hasMosque !== undefined ||
            villageData.hasChurch !== undefined
        ) {
            // On récupère le village actuel pour avoir toutes les données pour le score
            const current = await getVillage(id);
            if (current) {
                const refreshedData = { ...current, ...villageData };
                dataToUpdate.developmentScore = calculateDevelopmentScore(refreshedData);
            }
        }

        await updateDoc(docRef, dataToUpdate);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de modifier ce village.", { operation: 'update', path: `villages/${id}` });
        }
        throw error;
    }
}

export function subscribeToVillages(
    callback: (villages: Village[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(villagesCollection, orderBy("name", "asc"), limit(DEFAULT_QUERY_LIMIT));
    return onSnapshot(q, 
        (snapshot) => {
            const villages = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Village));
            callback(villages);
        },
        (error) => {
            console.error("Error in subscribeToVillages:", error);
            if (onError) onError(error);
        }
    );
}

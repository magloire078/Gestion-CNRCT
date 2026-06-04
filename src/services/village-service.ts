import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where, setDoc, limit, writeBatch } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { Village } from '@/types/village';
import type { Chief } from '@/types/chief';
import { FirestorePermissionError } from '@/lib/errors';
import { DEFAULT_QUERY_LIMIT } from '@/lib/firestore-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { ACTIVE_CHIEF_STATUSES } from '@/lib/schemas/chief-schema';

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

export async function addVillage(
    villageData: Omit<Village, 'id'>,
    photoFile?: File | null
): Promise<Village> {
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

    let photoUrl = villageData.photoUrl;
    if (photoFile) {
        photoUrl = await uploadToCloudinary(photoFile);
    }

    const now = new Date().toISOString();
    const dataWithAudit = {
        ...villageData,
        photoUrl,
        createdAt: now,
        updatedAt: now,
        developmentScore: calculateDevelopmentScore(villageData)
    };

    const docRef = await addDoc(villagesCollection, dataWithAudit);
    return { id: docRef.id, ...dataWithAudit } as Village;
}

export async function updateVillage(
    id: string,
    villageData: Partial<Omit<Village, 'id'>>,
    photoFile?: File | null
): Promise<void> {
    const docRef = doc(db, 'villages', id);
    try {
        const dataToUpdate: Partial<Village> & { updatedAt: string } = {
            ...villageData,
            updatedAt: new Date().toISOString()
        };

        if (photoFile) {
            dataToUpdate.photoUrl = await uploadToCloudinary(photoFile);
        }

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

/**
 * Erreur levée par deleteVillage quand des chefs sont encore en fonction
 * sur ce village. L'UI peut intercepter l'erreur et proposer à l'admin
 * de relancer avec { forceArchiveChiefs: true }.
 */
export class VillageStillHasActiveChiefsError extends Error {
    readonly activeChiefs: Chief[];
    constructor(activeChiefs: Chief[]) {
        super(
            `Le village ne peut pas être supprimé : ${activeChiefs.length} chef(s) y sont encore en fonction. ` +
            `Modifiez leur statut (démissionnaire ou décédé) avant de supprimer le village, ou utilisez l'option forceArchiveChiefs.`
        );
        this.name = 'VillageStillHasActiveChiefsError';
        this.activeChiefs = activeChiefs;
    }
}

export type DeleteVillageOptions = {
    /**
     * Si vrai, archive automatiquement les chefs encore en fonction sur ce
     * village (status -> 'archive') au lieu de bloquer la suppression.
     * À utiliser uniquement après confirmation explicite de l'utilisateur.
     */
    forceArchiveChiefs?: boolean;
};

/**
 * Supprime un village après vérification qu'aucun chef n'y est encore en
 * fonction. Lève VillageStillHasActiveChiefsError sinon (sauf si
 * forceArchiveChiefs = true, auquel cas les chefs concernés sont archivés
 * dans la même transaction batch).
 *
 * Les entrées RegencyHistory ne sont PAS supprimées : on garde l'historique
 * de la chefferie même si la fiche village disparaît administrativement.
 */
export async function deleteVillage(id: string, options: DeleteVillageOptions = {}): Promise<void> {
    if (!id) throw new Error('deleteVillage: id manquant');

    // 1. Identifie les chefs actuellement en fonction sur ce village
    const chiefsCol = collection(db, 'chiefs');
    const activeChiefsSnap = await getDocs(query(chiefsCol, where('villageId', '==', id)));
    const activeChiefs: Chief[] = activeChiefsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Chief))
        .filter((c) => !c.status || ACTIVE_CHIEF_STATUSES.includes(c.status));

    // 2. Bloque ou archive selon l'option
    if (activeChiefs.length > 0 && !options.forceArchiveChiefs) {
        throw new VillageStillHasActiveChiefsError(activeChiefs);
    }

    try {
        const batch = writeBatch(db);
        if (options.forceArchiveChiefs) {
            for (const chief of activeChiefs) {
                batch.update(doc(db, 'chiefs', chief.id), {
                    status: 'archive',
                    villageId: null,
                });
            }
        }
        batch.delete(doc(db, 'villages', id));
        await batch.commit();
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(
                "Vous n'avez pas la permission de supprimer ce village.",
                { operation: 'delete', path: `villages/${id}` }
            );
        }
        throw error;
    }
}

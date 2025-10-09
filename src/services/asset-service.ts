
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, updateDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import type { Asset } from '@/lib/data';
import { db } from '@/lib/firebase';
import { FirestorePermissionError } from '@/lib/errors';

const assetsCollection = collection(db, 'assets');

export function subscribeToAssets(
    callback: (assets: Asset[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(assetsCollection, orderBy("modele", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const assets = snapshot.docs.map(doc => ({
                tag: doc.id,
                ...doc.data()
            } as Asset));
            callback(assets);
        },
        (error) => {
            console.error("Error subscribing to assets:", error);
            if (error.code === 'permission-denied') {
                onError(new FirestorePermissionError("Vous n'avez pas la permission de consulter les actifs.", { query: "allAssets" }));
            } else {
                onError(error);
            }
        }
    );
    return unsubscribe;
}

export async function getAssets(): Promise<Asset[]> {
  try {
    const snapshot = await getDocs(query(assetsCollection, orderBy("modele", "asc")));
    return snapshot.docs.map(doc => ({
      tag: doc.id,
      ...doc.data()
    } as Asset));
  } catch(error: any) {
    if (error.code === 'permission-denied') {
        throw new FirestorePermissionError("Vous n'avez pas la permission de consulter les actifs.", { operation: 'read-all', path: 'assets' });
    }
    throw error;
  }
}

export async function getAsset(tag: string): Promise<Asset | null> {
    if (!tag) return null;
    const assetDocRef = doc(db, 'assets', tag);
    try {
        const docSnap = await getDoc(assetDocRef);
        if (docSnap.exists()) {
            return { tag: docSnap.id, ...docSnap.data() } as Asset;
        }
        return null;
    } catch(error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de consulter l'actif ${tag}.`, { operation: 'read', path: `assets/${tag}` });
        }
        throw error;
    }
}

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'> & { tag: string }): Promise<Asset> {
    const { tag, ...dataToSave } = assetDataToAdd;
    const assetRef = doc(db, 'assets', tag);

    const docSnap = await getDoc(assetRef);
    if(docSnap.exists()) {
        throw new Error(`Un actif avec le N° d'inventaire ${tag} existe déjà.`);
    }

    // Remove undefined fields before sending to Firestore
    Object.keys(dataToSave).forEach(key => {
        const dataKey = key as keyof typeof dataToSave;
        if (dataToSave[dataKey] === undefined) {
            delete dataToSave[dataKey];
        }
    });

    try {
        await setDoc(assetRef, dataToSave);
        return { tag, ...dataToSave };
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission d'ajouter un actif.", { operation: 'add', path: 'assets' });
        }
        throw error;
    }
}

export async function batchAddAssets(assets: (Omit<Asset, 'tag'> & { tag: string })[]): Promise<number> {
    const batch = writeBatch(db);
    let processedCount = 0;

    const tags = assets.map(a => a.tag).filter(Boolean);
    const existingTags = new Set<string>();

    // Firestore 'in' query is limited to 30 elements
    for (let i = 0; i < tags.length; i += 30) {
        const chunk = tags.slice(i, i + 30);
        if (chunk.length > 0) {
            const q = query(assetsCollection, where('__name__', 'in', chunk));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => existingTags.add(doc.id));
        }
    }

    for (const asset of assets) {
        if (asset.tag && !existingTags.has(asset.tag)) {
            const { tag, ...dataToSave } = asset;
            
            // Remove undefined fields before sending to Firestore
            Object.keys(dataToSave).forEach(key => {
                const dataKey = key as keyof typeof dataToSave;
                if (dataToSave[dataKey] === undefined) {
                    delete dataToSave[dataKey];
                }
            });

            const newDocRef = doc(assetsCollection, tag);
            batch.set(newDocRef, dataToSave);
            processedCount++;
        }
    }

    if (processedCount > 0) {
        try {
            await batch.commit();
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                throw new FirestorePermissionError("Vous n'avez pas la permission d'importer des actifs en masse.", { operation: 'batch-add', path: 'assets' });
            }
            throw error;
        }
    }
    return processedCount;
}


export async function updateAsset(tag: string, assetData: Partial<Asset>): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    try {
        await updateDoc(assetDocRef, assetData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de modifier l'actif ${tag}.`, { operation: 'update', path: `assets/${tag}` });
        }
        throw error;
    }
}

export async function deleteAsset(tag: string): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    try {
        await deleteDoc(assetDocRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de supprimer l'actif ${tag}.`, { operation: 'delete', path: `assets/${tag}` });
        }
        throw error;
    }
}

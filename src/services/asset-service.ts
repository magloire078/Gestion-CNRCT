
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, updateDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import type { Asset } from '@/lib/data';
import { db } from '@/lib/firebase';

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
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getAssets(): Promise<Asset[]> {
  const snapshot = await getDocs(query(assetsCollection, orderBy("modele", "asc")));
  return snapshot.docs.map(doc => ({
    tag: doc.id,
    ...doc.data()
  } as Asset));
}

export async function getAsset(tag: string): Promise<Asset | null> {
    if (!tag) return null;
    const assetDocRef = doc(db, 'assets', tag);
    const docSnap = await getDoc(assetDocRef);
    if (docSnap.exists()) {
        return { tag: docSnap.id, ...docSnap.data() } as Asset;
    }
    return null;
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

    await setDoc(assetRef, dataToSave);
    return { tag, ...dataToSave };
}

export async function batchAddAssets(assets: (Omit<Asset, 'tag'> & { tag: string })[]): Promise<number> {
    const batch = writeBatch(db);
    let processedCount = 0;

    for (const asset of assets) {
        if (asset.tag) {
            const { tag, ...dataToSave } = asset;
            
            // Remove undefined fields before sending to Firestore
            Object.keys(dataToSave).forEach(key => {
                const dataKey = key as keyof typeof dataToSave;
                if (dataToSave[dataKey] === undefined) {
                    delete dataToSave[dataKey];
                }
            });

            const newDocRef = doc(assetsCollection, tag);
            // Use set with merge to create new or update existing documents
            batch.set(newDocRef, dataToSave, { merge: true });
            processedCount++;
        }
    }

    if (processedCount > 0) {
        await batch.commit();
    }
    return processedCount;
}


export async function updateAsset(tag: string, assetData: Partial<Asset>): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await updateDoc(assetDocRef, assetData);
}

export async function deleteAsset(tag: string): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await deleteDoc(assetDocRef);
}


export async function searchVehicles(queryText: string): Promise<Asset[]> {
    const lowerCaseQuery = queryText.toLowerCase();
    const allAssets = await getAssets();
    return allAssets.filter(asset => 
        (asset.tag?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (asset.modele?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (asset.assignedTo?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (asset.fabricant?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (asset.numeroDeSerie?.toLowerCase() || '').includes(lowerCaseQuery)
    );
}

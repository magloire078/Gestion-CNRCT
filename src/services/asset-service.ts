
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

    await setDoc(assetRef, dataToSave);
    return { tag, ...dataToSave };
}

export async function batchAddAssets(assets: (Omit<Asset, 'tag'> & { tag: string })[]): Promise<number> {
    const batch = writeBatch(db);
    const tags = assets.map(a => a.tag).filter(Boolean);
    if (tags.length === 0) return 0;
    
    // Check for existing tags in chunks of 30
    const existingTags = new Set<string>();
    for (let i = 0; i < tags.length; i += 30) {
        const chunk = tags.slice(i, i + 30);
        const q = query(assetsCollection, where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => existingTags.add(doc.id));
    }

    let addedCount = 0;
    assets.forEach(asset => {
        if (asset.tag && !existingTags.has(asset.tag)) {
            const { tag, ...dataToSave } = asset;
            const newDocRef = doc(assetsCollection, tag);
            batch.set(newDocRef, dataToSave);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        await batch.commit();
    }
    return addedCount;
}


export async function updateAsset(tag: string, assetData: Partial<Asset>): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await updateDoc(assetDocRef, assetData);
}

export async function deleteAsset(tag: string): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await deleteDoc(assetDocRef);
}

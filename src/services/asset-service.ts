
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  const snapshot = await getDocs(assetsCollection);
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

    await setDoc(assetRef, dataToSave);
    return { tag, ...dataToSave };
}

export async function updateAsset(tag: string, assetData: Partial<Asset>): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await updateDoc(assetDocRef, assetData);
}

export async function deleteAsset(tag: string): Promise<void> {
    const assetDocRef = doc(db, 'assets', tag);
    await deleteDoc(assetDocRef);
}

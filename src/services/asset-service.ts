
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Asset } from '@/lib/data';
import { db } from '@/lib/firebase';

const assetsCollection = collection(db, 'assets');

export function subscribeToAssets(
    callback: (assets: Asset[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(assetsCollection, orderBy("model", "asc"));
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

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'> & { tag?: string }): Promise<Asset> {
    const assetTag = assetDataToAdd.tag || `IT-ASSET-${Date.now()}`;
    const assetRef = doc(db, 'assets', assetTag);
    await setDoc(assetRef, assetDataToAdd);
    return { tag: assetTag, ...assetDataToAdd };
}

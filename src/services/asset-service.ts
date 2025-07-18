
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Asset } from '@/lib/data';

export function subscribeToAssets(
    callback: (assets: Asset[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const assetsCollection = collection(db, 'assets');
    const q = query(assetsCollection, orderBy("model", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const assetList = snapshot.docs.map(doc => ({ tag: doc.id, ...doc.data() } as Asset));
        callback(assetList);
    }, (error) => {
        console.error("Error subscribing to assets:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getAssets(): Promise<Asset[]> {
  const assetsCollection = collection(db, 'assets');
  const assetSnapshot = await getDocs(assetsCollection);
  const assetList = assetSnapshot.docs.map(doc => ({ tag: doc.id, ...doc.data() } as Asset));
  return assetList;
}

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'> & { tag?: string }): Promise<Asset> {
    const { tag, ...data } = assetDataToAdd;
    const newTag = tag || `IT-${data.type.substring(0,3).toUpperCase()}-${Date.now()}`;
    const assetRef = doc(db, 'assets', newTag);
    await setDoc(assetRef, data);
    const newAsset: Asset = { 
        tag: newTag, 
        ...data
    };
    return newAsset;
}

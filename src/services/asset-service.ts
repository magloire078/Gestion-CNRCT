
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Asset } from '@/lib/data';

export async function getAssets(): Promise<Asset[]> {
  const assetsCollection = collection(db, 'assets');
  const assetSnapshot = await getDocs(assetsCollection);
  const assetList = assetSnapshot.docs.map(doc => ({ tag: doc.id, ...doc.data() } as Asset));
  return assetList;
}

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'> & { tag?: string }): Promise<Asset> {
    const { tag, ...data } = assetDataToAdd;
    const newTag = tag || `IT-NEW-${Date.now()}`;
    const assetRef = doc(db, 'assets', newTag);
    await setDoc(assetRef, data);
    const newAsset: Asset = { 
        tag: newTag, 
        ...data
    };
    return newAsset;
}

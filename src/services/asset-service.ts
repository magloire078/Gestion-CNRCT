
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Asset } from '@/lib/data';

export async function getAssets(): Promise<Asset[]> {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return [];
  }
  const assetsCollection = collection(db, 'assets');
  const assetSnapshot = await getDocs(assetsCollection);
  const assetList = assetSnapshot.docs.map(doc => {
    return {
      tag: doc.id,
      ...doc.data()
    } as Asset;
  });
  return assetList;
}

export async function addAsset(assetData: Omit<Asset, 'tag'>): Promise<Asset> {
    if (!db) {
      throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const assetsCollection = collection(db, 'assets');
    const docRef = await addDoc(assetsCollection, assetData);
    
    const newAsset: Asset = {
        tag: docRef.id,
        ...assetData
    };
    return newAsset;
}

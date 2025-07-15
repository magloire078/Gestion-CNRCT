
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Asset } from '@/lib/data';

const assetsCollection = collection(db, 'assets');

export async function getAssets(): Promise<Asset[]> {
  const assetSnapshot = await getDocs(assetsCollection);
  const assetList = assetSnapshot.docs.map(doc => {
    // The asset tag is the document ID in Firestore.
    // For other fields, we spread the document data.
    return {
      tag: doc.id,
      ...doc.data()
    } as Asset;
  });
  return assetList;
}

export async function addAsset(assetData: Omit<Asset, 'tag'>): Promise<Asset> {
    // Firestore will auto-generate a unique ID for the new document.
    const docRef = await addDoc(assetsCollection, assetData);
    
    // The new asset object includes the auto-generated ID as its 'tag'.
    const newAsset: Asset = {
        tag: docRef.id,
        ...assetData
    };
    return newAsset;
}

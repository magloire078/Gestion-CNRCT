
import type { Asset } from '@/lib/data';
import { assetData } from '@/lib/data';


export async function getAssets(): Promise<Asset[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(assetData);
}

export async function addAsset(assetDataToAdd: Omit<Asset, 'tag'>): Promise<Asset> {
    const newAsset: Asset = { 
        tag: `IT-NEW-${Math.floor(Math.random() * 1000)}`, 
        ...assetDataToAdd
    };
    assetData.push(newAsset);
    return Promise.resolve(newAsset);
}

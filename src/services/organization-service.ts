
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from '@/lib/firebase';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

export type OrganizationSettings = {
    mainLogoUrl: string;
    secondaryLogoUrl: string;
};

export type OrganizationSettingsInput = Partial<{
    mainLogoUrl: string; // Can be a data URI for new uploads or existing URL
    secondaryLogoUrl: string; // Can be a data URI for new uploads or existing URL
}>;

async function uploadLogo(logoDataUri: string, logoName: 'mainLogo' | 'secondaryLogo'): Promise<string> {
    // If it's not a data URI, it's an existing URL. Just return it.
    if (!logoDataUri || !logoDataUri.startsWith('data:image')) {
        return logoDataUri; 
    }
    
    const storage = getStorage();
    const logoRef = ref(storage, `organization/${logoName}`);

    try {
        const snapshot = await uploadString(logoRef, logoDataUri, 'data_url');
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error(`Failed to upload ${logoName}:`, error);
        throw new Error(`Failed to upload logo ${logoName}.`);
    }
}


export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as OrganizationSettings;
    }
    // Return default empty state if not found
    return { mainLogoUrl: '', secondaryLogoUrl: '' };
}

export async function saveOrganizationSettings(settingsToUpdate: OrganizationSettingsInput): Promise<OrganizationSettings> {
    const updateData: Partial<OrganizationSettings> = {};

    if (settingsToUpdate.mainLogoUrl) {
        updateData.mainLogoUrl = await uploadLogo(settingsToUpdate.mainLogoUrl, 'mainLogo');
    }
    if (settingsToUpdate.secondaryLogoUrl) {
        updateData.secondaryLogoUrl = await uploadLogo(settingsToUpdate.secondaryLogoUrl, 'secondaryLogo');
    }
    
    // Use setDoc with merge:true to create the doc if it doesn't exist, or update it if it does
    await setDoc(settingsDocRef, updateData, { merge: true });

    // Return the updated settings from the database
    const docSnap = await getDoc(settingsDocRef);
    return docSnap.data() as OrganizationSettings;
}


import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    if (!logoDataUri.startsWith('data:image')) {
        return logoDataUri; // It's already a URL, no need to upload
    }
    const storage = getStorage();
    const logoRef = ref(storage, `organization/${logoName}`);

    // Delete old logo if it exists to prevent orphaned files
    try {
        await deleteObject(logoRef);
    } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
            console.warn("Could not delete old logo, it may not exist:", error);
        }
    }

    const snapshot = await uploadString(logoRef, logoDataUri, 'data_url');
    return await getDownloadURL(snapshot.ref);
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
    const updateData: OrganizationSettingsInput = {};

    if (settingsToUpdate.mainLogoUrl) {
        updateData.mainLogoUrl = await uploadLogo(settingsToUpdate.mainLogoUrl, 'mainLogo');
    }
    if (settingsToUpdate.secondaryLogoUrl) {
        updateData.secondaryLogoUrl = await uploadLogo(settingsToUpdate.secondaryLogoUrl, 'secondaryLogo');
    }
    
    // Use setDoc with merge:true to create the doc if it doesn't exist, or update it if it does
    await setDoc(settingsDocRef, updateData, { merge: true });

    return await getOrganizationSettings();
}

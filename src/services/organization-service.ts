
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { db } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);


export type OrganizationSettingsInput = Partial<{
    organizationName: string;
    mainLogoFile: File | null;
    secondaryLogoFile: File | null;
    faviconFile: File | null;
}>;


async function uploadLogoWithProgress(
    file: File, 
    logoName: 'mainLogo' | 'secondaryLogo' | 'favicon',
    onProgress: (progress: number) => void
): Promise<string> {
    const storage = getStorage();
    const logoRef = ref(storage, `organization/${logoName}`);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(logoRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error(`Failed to upload ${logoName}:`, error);
                reject(new Error(`Failed to upload logo ${logoName}.`));
            },
            async () => {
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadUrl);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}


export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as OrganizationSettings;
    }
    // Return default empty state if not found
    return { organizationName: 'Gestion CNRCT', mainLogoUrl: '', secondaryLogoUrl: '', faviconUrl: '' };
}

export async function saveOrganizationSettings(
    settingsToUpdate: OrganizationSettingsInput,
    onProgress: (progress: number) => void
): Promise<OrganizationSettings> {
    const updateData: Partial<OrganizationSettings> = {};

    if (settingsToUpdate.organizationName) {
        updateData.organizationName = settingsToUpdate.organizationName;
    }

    if (settingsToUpdate.mainLogoFile) {
        updateData.mainLogoUrl = await uploadLogoWithProgress(settingsToUpdate.mainLogoFile, 'mainLogo', onProgress);
    }
    if (settingsToUpdate.secondaryLogoFile) {
        updateData.secondaryLogoUrl = await uploadLogoWithProgress(settingsToUpdate.secondaryLogoFile, 'secondaryLogo', onProgress);
    }
    if (settingsToUpdate.faviconFile) {
        updateData.faviconUrl = await uploadLogoWithProgress(settingsToUpdate.faviconFile, 'favicon', onProgress);
    }
    
    await setDoc(settingsDocRef, updateData, { merge: true });

    const docSnap = await getDoc(settingsDocRef);
    return docSnap.data() as OrganizationSettings;
}

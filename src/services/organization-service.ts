
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as OrganizationSettings;
        }
    } catch (e) {
        console.error("Could not get organization settings from Firestore, returning default.", e);
    }
    // Return default empty state if not found or on error
    return { organizationName: 'Gestion CNRCT', mainLogoUrl: '', secondaryLogoUrl: '', faviconUrl: '' };
}

export async function saveOrganizationName(name: string): Promise<void> {
    await setDoc(settingsDocRef, { organizationName: name }, { merge: true });
}

export async function uploadOrganizationFile(
    fileType: 'mainLogo' | 'secondaryLogo' | 'favicon',
    file: File | null
): Promise<string | undefined> {
    if (!file) {
        return undefined;
    }

    const fileName = `${fileType}_${new Date().getTime()}_${file.name}`;
    const fileRef = ref(storage, `organization/${fileName}`);
    
    // Directly upload the file without AI processing
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    const fieldToUpdate = `${fileType}Url`;
    await setDoc(settingsDocRef, { [fieldToUpdate]: downloadUrl }, { merge: true });
    
    return downloadUrl;
}

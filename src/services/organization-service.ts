
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';
import { processLogo } from '@/ai/flows/process-logo-flow';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

export type UploadTaskController = {
    cancel: () => void;
}

// Helper to read file as data URL
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

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
    fileType: 'main' | 'secondary' | 'favicon',
    file: File | null
): Promise<string | undefined> {
    if (!file) {
        return undefined;
    }

    const logoName = `${fileType}_${new Date().getTime()}_${file.name}`;
    const logoRef = ref(storage, `organization/${logoName}`);
    
    let fileToUpload = file;

    // AI processing for logos, not for favicon
    if (fileType !== 'favicon') {
        try {
            const dataUrl = await fileToDataUrl(file);
            const processedDataUrl = await processLogo(dataUrl);
            const blob = await fetch(processedDataUrl).then(res => res.blob());
            fileToUpload = new File([blob], file.name, { type: 'image/png' });
        } catch (error) {
            console.warn(`AI logo processing failed for ${fileType} logo. Falling back to original image. Error:`, error);
        }
    }
    
    const snapshot = await uploadBytes(logoRef, fileToUpload);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    const fieldToUpdate = fileType === 'main' ? 'mainLogoUrl' : (fileType === 'secondary' ? 'secondaryLogoUrl' : 'faviconUrl');
    await setDoc(settingsDocRef, { [fieldToUpdate]: downloadUrl }, { merge: true });
    
    return downloadUrl;
}

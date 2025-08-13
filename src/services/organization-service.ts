
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask } from "firebase/storage";
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
    file: File,
    onProgress: (progress: number) => void,
    onControllerReady: (controller: UploadTaskController) => void
): Promise<string> {

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
    
    const uploadTask = uploadBytesResumable(logoRef, fileToUpload);

    onControllerReady({ cancel: () => uploadTask.cancel() });
    
    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                if (error.code !== 'storage/canceled') {
                    console.error(`Upload failed for ${logoName}:`, error);
                }
                reject(error);
            },
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                const fieldToUpdate = fileType === 'main' ? 'mainLogoUrl' : (fileType === 'secondary' ? 'secondaryLogoUrl' : 'faviconUrl');
                await setDoc(settingsDocRef, { [fieldToUpdate]: downloadUrl }, { merge: true });
                resolve(downloadUrl);
            }
        );
    });
}

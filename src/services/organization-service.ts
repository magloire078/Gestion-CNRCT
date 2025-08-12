
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask, uploadString } from "firebase/storage";
import { db } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';
import { processLogo } from '@/ai/flows/process-logo-flow';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);


export type OrganizationSettingsInput = Partial<{
    organizationName: string;
    mainLogoFile: File | null;
    secondaryLogoFile: File | null;
    faviconFile: File | null;
}>;

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

function uploadProcessedLogo(
    dataUrl: string, 
    logoName: 'mainLogo' | 'secondaryLogo' | 'favicon',
    onProgress: (progress: number) => void,
    onControllerReady: (controller: UploadTaskController) => void,
): Promise<string> {
    const storage = getStorage();
    // Always upload as PNG to preserve transparency
    const logoRef = ref(storage, `organization/${logoName}.png`);

    // Convert data URL back to Blob for uploadBytesResumable which provides progress
    const blobPromise = fetch(dataUrl).then(res => res.blob());

    return new Promise((resolve, reject) => {
        blobPromise.then(blob => {
            const uploadTask = uploadBytesResumable(logoRef, blob, { contentType: 'image/png' });

            onControllerReady({
                cancel: () => uploadTask.cancel()
            });

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => {
                    if (error.code !== 'storage/canceled') {
                        console.error(`Failed to upload ${logoName}:`, error);
                    }
                    reject(error);
                },
                async () => {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadUrl);
                }
            );
        }).catch(reject);
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

export function saveOrganizationSettings(
    settingsToUpdate: OrganizationSettingsInput,
    onProgress: (progress: number) => void,
    onControllerReady: (controller: UploadTaskController) => void
): { taskPromise: Promise<OrganizationSettings> } {

    const taskPromise = (async () => {
        const updateData: Partial<OrganizationSettings> = {};
        
        // Handle name update separately and first
        if (settingsToUpdate.organizationName) {
            updateData.organizationName = settingsToUpdate.organizationName;
             await setDoc(settingsDocRef, { organizationName: settingsToUpdate.organizationName }, { merge: true });
        }


        const uploadFile = async (file: File, logoName: 'mainLogo' | 'secondaryLogo' | 'favicon') => {
            const dataUrl = await fileToDataUrl(file);
            let processedDataUrl = dataUrl;
            
            // AI processing step with fallback
            if (logoName !== 'favicon') {
                try {
                    processedDataUrl = await processLogo(dataUrl);
                } catch (error) {
                    console.warn(`AI logo processing failed for ${logoName}. Falling back to original image. Error:`, error);
                }
            }

            const downloadUrl = await uploadProcessedLogo(
                processedDataUrl, 
                logoName, 
                onProgress,
                onControllerReady
            );
            
            return downloadUrl;
        };

        if (settingsToUpdate.mainLogoFile) {
            updateData.mainLogoUrl = await uploadFile(settingsToUpdate.mainLogoFile, 'mainLogo');
        } else if (settingsToUpdate.secondaryLogoFile) {
            updateData.secondaryLogoUrl = await uploadFile(settingsToUpdate.secondaryLogoFile, 'secondaryLogo');
        } else if (settingsToUpdate.faviconFile) {
            updateData.faviconUrl = await uploadFile(settingsToUpdate.faviconFile, 'favicon');
        }
        
        if (Object.keys(updateData).length > 0 && !updateData.organizationName) {
            await setDoc(settingsDocRef, updateData, { merge: true });
        }

        const docSnap = await getDoc(settingsDocRef);
        return docSnap.data() as OrganizationSettings;
    })();

    return { taskPromise };
}

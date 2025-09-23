
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';

const SETTINGS_DOC_ID = 'app_settings'; // Use a consistent ID
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

const defaultMainLogoUrl = "/assets/cnrct-logo.png";
const defaultSecondaryLogoUrl = "/assets/ci-logo.png";

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                organizationName: data.organizationName || 'Gestion CNRCT',
                mainLogoUrl: data.mainLogoUrl || defaultMainLogoUrl,
                secondaryLogoUrl: data.secondaryLogoUrl || defaultSecondaryLogoUrl,
                faviconUrl: data.faviconUrl || '',
            };
        }
    } catch (e) {
        console.error("Could not get organization settings from Firestore, returning default.", e);
    }
    // Return default settings if doc doesn't exist or on error
     await setDoc(settingsDocRef, {
        organizationName: 'Gestion CNRCT',
        mainLogoUrl: defaultMainLogoUrl,
        secondaryLogoUrl: defaultSecondaryLogoUrl,
        faviconUrl: ''
    }, { merge: true });

    return {
        organizationName: 'Gestion CNRCT',
        mainLogoUrl: defaultMainLogoUrl,
        secondaryLogoUrl: defaultSecondaryLogoUrl,
        faviconUrl: ''
    };
}

export async function saveOrganizationName(name: string): Promise<void> {
    await setDoc(settingsDocRef, { organizationName: name }, { merge: true });
}

export async function uploadOrganizationFile(
    fileType: 'mainLogo' | 'secondaryLogo' | 'favicon',
    file: File,
    onProgress: (percentage: number) => void
): Promise<string> {
    const fileName = `${fileType}_${new Date().getTime()}_${file.name}`;
    const fileRef = ref(storage, `organization/${fileName}`);
    
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const fieldToUpdate = `${fileType}Url`;
                    await setDoc(settingsDocRef, { [fieldToUpdate]: downloadURL }, { merge: true });
                    resolve(downloadURL);
                } catch (error) {
                    console.error("Firestore update failed:", error);
                    reject(error);
                }
            }
        );
    });
}

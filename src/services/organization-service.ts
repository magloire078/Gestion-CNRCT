
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';

const SETTINGS_DOC_ID = 'organization_settings';
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

const defaultSecondaryLogoUrl = "https://storage.googleapis.com/demobuilder-testing.appspot.com/uploads/1721921387603_republique-ci-logo.png";
const defaultMainLogoUrl = "https://storage.googleapis.com/demobuilder-testing.appspot.com/uploads/1721919864275_cnrct.png";

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
        uploadTask.on('state_changed',
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
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    const fieldToUpdate = `${fileType}Url`;
                    await setDoc(settingsDocRef, { [fieldToUpdate]: downloadUrl }, { merge: true });
                    resolve(downloadUrl);
                } catch (error) {
                    console.error("Failed to get download URL or update Firestore:", error);
                    reject(error);
                }
            }
        );
    });
}

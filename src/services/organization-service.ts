
import { doc, getDoc, setDoc } from '@/lib/firebase';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';

const SETTINGS_DOC_ID = 'app_settings'; // Use a consistent ID
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

const defaultMainLogoUrl = "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png";
const defaultSecondaryLogoUrl = defaultMainLogoUrl;

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                organizationName: data.organizationName || 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
                mainLogoUrl: data.mainLogoUrl || defaultMainLogoUrl,
                secondaryLogoUrl: data.secondaryLogoUrl || defaultSecondaryLogoUrl,
                faviconUrl: data.faviconUrl || '',
            };
        }
    } catch (e) {
        // Silently handle permission errors - this is expected when not authenticated
        // The default settings will be returned and created if needed
    }

    // Return default settings if doc doesn't exist or on error
    // Try to create the default settings document (will fail silently if no permissions)
    try {
        await setDoc(settingsDocRef, {
            organizationName: 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
            mainLogoUrl: defaultMainLogoUrl,
            secondaryLogoUrl: defaultSecondaryLogoUrl,
            faviconUrl: ''
        }, { merge: true });
    } catch (e) {
        // Silently ignore - user may not have write permissions yet
    }

    return {
        organizationName: 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
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


import { doc, getDoc, setDoc } from '@/lib/firebase';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { OrganizationSettings } from '@/lib/data';
import { resizeImage } from '@/lib/image-optimization';

const SETTINGS_DOC_ID = 'app_settings'; // Use a consistent ID
const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);

const defaultMainLogoUrl = "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png";
const defaultSecondaryLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/4/4a/Coat_of_arms_of_C%C3%B4te_d%27Ivoire_%281997-2001_variant%29.svg";

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            let mainLogoUrl = data.mainLogoUrl || defaultMainLogoUrl;
            let secondaryLogoUrl = data.secondaryLogoUrl || defaultSecondaryLogoUrl;

            // Proactive replacement of problematic Pinterest URLs
            if (secondaryLogoUrl.includes('i.pinimg.com')) {
                secondaryLogoUrl = defaultSecondaryLogoUrl;
            }
            if (mainLogoUrl.includes('i.pinimg.com')) {
                mainLogoUrl = defaultMainLogoUrl;
            }

            return {
                organizationName: data.organizationName || 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
                mainLogoUrl,
                secondaryLogoUrl,
                faviconUrl: data.faviconUrl || mainLogoUrl || '',
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
            faviconUrl: defaultMainLogoUrl // Use main logo as default favicon
        }, { merge: true });
    } catch (e) {
        // Silently ignore - user may not have write permissions yet
    }

    return {
        organizationName: 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
        mainLogoUrl: defaultMainLogoUrl,
        secondaryLogoUrl: defaultSecondaryLogoUrl,
        faviconUrl: defaultMainLogoUrl // Use main logo as default favicon
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

    // Optimize image before upload
    const imageBlob = await resizeImage(file, 1024);

    const uploadTask = uploadBytesResumable(fileRef, imageBlob);

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

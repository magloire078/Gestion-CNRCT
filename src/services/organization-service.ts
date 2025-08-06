
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

export type OrganizationSettings = {
    mainLogoUrl: string;
    secondaryLogoUrl: string;
};

// Internal type to handle both URL strings and new file data URIs
export type OrganizationSettingsInput = {
    mainLogoUrl: string; // Can be a gs://, https://, or data: URL
    secondaryLogoUrl: string; // Can be a gs://, https://, or data: URL
};


const defaultSettings: OrganizationSettings = {
    mainLogoUrl: 'https://placehold.co/100x100.png',
    secondaryLogoUrl: 'https://placehold.co/100x100.png'
};

const settingsDocRef = doc(db, 'settings', 'organization');

/**
 * Retrieves the organization settings from Firestore.
 * If no settings are found, it returns default values.
 * @returns {Promise<OrganizationSettings>} The organization settings.
 */
export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as OrganizationSettings;
        } else {
            // If the document doesn't exist, you might want to create it with defaults
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error getting organization settings, returning defaults:", error);
        return defaultSettings;
    }
}

/**
 * Saves the organization settings to Firestore.
 * Handles uploading new logos (passed as data URIs) to Firebase Storage.
 * @param {OrganizationSettingsInput} settings The settings to save.
 * @returns {Promise<void>}
 */
export async function saveOrganizationSettings(settings: OrganizationSettingsInput): Promise<void> {
    const storage = getStorage();

    const processLogo = async (newLogoData: string, storagePath: string): Promise<string> => {
        // If the new data is not a data URI, it's an existing URL, so no change is needed.
        if (!newLogoData || !newLogoData.startsWith('data:image')) {
            return newLogoData;
        }

        // It's a new file, upload it to storage
        const storageRef = ref(storage, storagePath);
        
        // Upload the new logo
        await uploadString(storageRef, newLogoData, 'data_url');
        
        // Return the new download URL
        return await getDownloadURL(storageRef);
    };

    const newMainLogoUrl = await processLogo(settings.mainLogoUrl, 'organization/main_logo');
    const newSecondaryLogoUrl = await processLogo(settings.secondaryLogoUrl, 'organization/secondary_logo');

    const finalSettings: OrganizationSettings = {
        mainLogoUrl: newMainLogoUrl,
        secondaryLogoUrl: newSecondaryLogoUrl,
    };

    await setDoc(settingsDocRef, finalSettings, { merge: true });
}

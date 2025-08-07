
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

export type OrganizationSettings = {
    mainLogoUrl: string;
    secondaryLogoUrl: string;
};

// Use Partial for input to allow updating one logo at a time
export type OrganizationSettingsInput = Partial<{
    mainLogoUrl: string; // Can be a gs://, https://, or data: URL
    secondaryLogoUrl: string; // Can be a gs://, https://, or data: URL
}>;


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
            // If the document doesn't exist, create it with defaults
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error getting organization settings, returning defaults:", error);
        return defaultSettings;
    }
}

/**
 * Saves organization settings. Can save one or both logos.
 * @param {OrganizationSettingsInput} settingsToUpdate The settings to save (can be partial).
 * @returns {Promise<OrganizationSettings>} The final, saved settings.
 */
export async function saveOrganizationSettings(settingsToUpdate: OrganizationSettingsInput): Promise<OrganizationSettings> {
    const storage = getStorage();
    const currentSettings = await getOrganizationSettings();
    let finalSettings = { ...currentSettings };

    const processLogo = async (logoData: string | undefined, storagePath: string): Promise<string | undefined> => {
        // Only process if it's a new file (data URI)
        if (logoData && logoData.startsWith('data:image')) {
            const storageRef = ref(storage, storagePath);
            await uploadString(storageRef, logoData, 'data_url');
            return getDownloadURL(storageRef);
        }
        // If it's not a data URI, it's either an existing URL or undefined.
        // If undefined, it means this logo is not being updated, so we keep the old value.
        // If it's an existing URL, it means no new file was chosen, so we also keep the old value.
        return undefined; // Indicates no change to be made to this field
    };
    
    const newMainLogoUrl = await processLogo(settingsToUpdate.mainLogoUrl, 'organization/main_logo.png');
    if (newMainLogoUrl) {
        finalSettings.mainLogoUrl = newMainLogoUrl;
    }

    const newSecondaryLogoUrl = await processLogo(settingsToUpdate.secondaryLogoUrl, 'organization/secondary_logo.png');
    if (newSecondaryLogoUrl) {
        finalSettings.secondaryLogoUrl = newSecondaryLogoUrl;
    }
    
    // Update the document in Firestore
    await setDoc(settingsDocRef, finalSettings, { merge: true });

    return finalSettings;
}

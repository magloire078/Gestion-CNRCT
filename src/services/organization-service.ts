
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type OrganizationSettings = {
    mainLogoUrl: string;
    secondaryLogoUrl: string;
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
 * @param {OrganizationSettings} settings The settings to save.
 * @returns {Promise<void>}
 */
export async function saveOrganizationSettings(settings: OrganizationSettings): Promise<void> {
    await setDoc(settingsDocRef, settings, { merge: true });
}

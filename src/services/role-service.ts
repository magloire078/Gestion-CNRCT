

import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, writeBatch, updateDoc, type QueryDocumentSnapshot, type DocumentData } from '@/lib/firebase';
import type { Role } from '@/lib/data';
import { db } from '@/lib/firebase';
import { allPermissions } from '@/lib/permissions';
import { ENTERPRISE_ROLES } from '@/types/permissions';

const rolesCollection = collection(db, 'roles');

/** 
 * Legacy roles list replaced by the modern enterprise roles config
 */
const legacyDefaultRoles: Omit<Role, 'id'>[] = [
    {
        name: 'Super Administrateur',
        permissions: Object.values(allPermissions)
    }
    // ... rest of legacy roles are replaced by ENTERPRISE_ROLES
];

export async function initializeDefaultRoles() {
    const snapshot = await getDocs(rolesCollection);
    if (snapshot.empty) {
        await syncDefaultRoles();
    }
}

/**
 * Force synchronization of default roles into Firestore.
 * This will overwrite existing roles with the same IDs.
 */
export async function syncDefaultRoles() {
    const batch = writeBatch(db);

    ENTERPRISE_ROLES.forEach((roleConfig) => {
        const roleRef = doc(db, 'roles', roleConfig.id);
        
        // Prepare doc data
        const data: any = {
            name: roleConfig.label,
            resourcePermissions: roleConfig.defaultPermissions,
            updatedAt: new Date().toISOString()
        };

        // For some core roles, we also keep the flat permissions list for backward compatibility with older UI components
        if (roleConfig.id === 'LHcHyfBzile3r0vyFOFb' || roleConfig.id === 'administrateur') {
            data.permissions = Object.values(allPermissions);
        }

        // Use merge: true to avoid deleting custom fields if any
        batch.set(roleRef, data, { merge: true });
    });

    await batch.commit();
}

export function subscribeToRoles(
    callback: (roles: Role[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(rolesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const roles = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            } as Role));
            callback(roles);
        },
        (error) => {
            console.error("Error subscribing to roles:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

let cachedRoles: Role[] | null = null;

export async function getRoles(): Promise<Role[]> {
    if (cachedRoles) return cachedRoles;
    
    try {
        const snapshot = await getDocs(query(rolesCollection, orderBy("name", "asc")));
        if (snapshot.empty) {
            // Only try to initialize default roles if we have sufficient permissions.
            // Non-admin users (read-only) will silently skip this step.
            try {
                await syncDefaultRoles();
                const newSnapshot = await getDocs(query(rolesCollection, orderBy("name", "asc")));
                cachedRoles = newSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Role));
                return cachedRoles;
            } catch (initError) {
                console.warn('[RoleService] Could not initialize default roles (insufficient permissions). Returning empty list.', initError);
                return [];
            }
        }
        cachedRoles = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        } as Role));
        return cachedRoles;
    } catch (error) {
        console.warn('[RoleService] Error fetching roles:', error);
        return [];
    }
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const roleNameId = roleDataToAdd.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const docRef = doc(db, 'roles', roleNameId);
    await setDoc(docRef, roleDataToAdd);
    return { id: docRef.id, ...roleDataToAdd };
}

export async function updateRole(roleId: string, roleData: Partial<Role>): Promise<void> {
    const roleDocRef = doc(db, 'roles', roleId);
    await updateDoc(roleDocRef, roleData);
}

export async function deleteRole(roleId: string): Promise<void> {
    const roleDocRef = doc(db, 'roles', roleId);
    await deleteDoc(roleDocRef);
}

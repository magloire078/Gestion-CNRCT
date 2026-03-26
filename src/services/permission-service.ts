
import { doc, getDoc, updateDoc, setDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { CrudPermission, ResourcePermissions, CrudAction } from '@/types/permissions';
import { RESOURCES_CONFIG, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import type { User } from '@/types/auth';

const rolesCollection = 'roles';

/** Récupère les permissions par ressource d'un rôle. */
export async function getResourcePermissions(roleId: string): Promise<ResourcePermissions> {
    if (!roleId) return {};
    const roleRef = doc(db, rolesCollection, roleId);
    const snap = await getDoc(roleRef);
    if (!snap.exists()) return getDefaultPermissions(roleId);
    const data = snap.data();
    if (data.resourcePermissions) return data.resourcePermissions as ResourcePermissions;
    return getDefaultPermissions(roleId);
}

/** Retourne les permissions par défaut pour un rôle. */
export function getDefaultPermissions(roleId: string): ResourcePermissions {
    return DEFAULT_ROLE_PERMISSIONS[roleId] ?? buildEmptyPermissions();
}

/** Construit une matrice vide (tout à false). */
function buildEmptyPermissions(): ResourcePermissions {
    const result: ResourcePermissions = {};
    for (const r of RESOURCES_CONFIG) {
        result[r.id] = { read: false, create: false, update: false, delete: false };
    }
    return result;
}

/** Met à jour atomiquement les permissions d'un rôle pour une ressource donnée. */
export async function updateResourcePermission(
    roleId: string,
    resource: string,
    action: CrudAction,
    value: boolean
): Promise<void> {
    const roleRef = doc(db, rolesCollection, roleId);
    const snap = await getDoc(roleRef);

    const current: ResourcePermissions = snap.exists() && snap.data().resourcePermissions
        ? snap.data().resourcePermissions
        : getDefaultPermissions(roleId);

    const updated: ResourcePermissions = {
        ...current,
        [resource]: {
            ...((current[resource] as CrudPermission) ?? { read: false, create: false, update: false, delete: false }),
            [action]: value,
        },
    };

    if (snap.exists()) {
        await updateDoc(roleRef, { resourcePermissions: updated });
    } else {
        await setDoc(roleRef, { resourcePermissions: updated }, { merge: true });
    }
}

/** Sauvegarde toute la matrice de permissions d'un rôle en une seule opération. */
export async function saveAllResourcePermissions(
    roleId: string,
    permissions: ResourcePermissions
): Promise<void> {
    const roleRef = doc(db, rolesCollection, roleId);
    const snap = await getDoc(roleRef);
    if (snap.exists()) {
        await updateDoc(roleRef, { resourcePermissions: permissions });
    } else {
        await setDoc(roleRef, { resourcePermissions: permissions }, { merge: true });
    }
}

/** Vérifie si un utilisateur a le droit de faire une action sur une ressource.
 *  Utilise le cache local des permissions du rôle de l'utilisateur.
 */
export function checkPermission(
    resourcePermissions: ResourcePermissions,
    resource: string,
    action: CrudAction
): boolean {
    const perm = resourcePermissions[resource];
    if (!perm) return false;
    return perm[action] === true;
}

/** Initialise les permissions par défaut pour un rôle s'il n'en a pas encore.
 *  À appeler une fois au démarrage de la section admin.
 */
export async function syncDefaultPermissionsIfMissing(roleId: string): Promise<void> {
    const roleRef = doc(db, rolesCollection, roleId);
    const snap = await getDoc(roleRef);
    const defaults = getDefaultPermissions(roleId);

    if (!snap.exists()) {
        await setDoc(roleRef, { 
            name: roleId, 
            permissions: [], 
            resourcePermissions: defaults 
        }, { merge: true });
        return;
    }

    const data = snap.data();
    const currentPerms = data.resourcePermissions as ResourcePermissions || {};
    
    // Vrifie si de nouvelles ressources sont prsentes dans les defaults mais absentes de Firestore
    let needsUpdate = false;
    const mergedPerms = { ...currentPerms };

    for (const resourceId in defaults) {
        if (!mergedPerms[resourceId]) {
            mergedPerms[resourceId] = defaults[resourceId];
            needsUpdate = true;
        }
    }

    if (needsUpdate || !data.resourcePermissions) {
        await updateDoc(roleRef, { resourcePermissions: mergedPerms });
    }
}

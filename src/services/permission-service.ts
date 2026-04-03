
import { doc, getDoc, updateDoc, setDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { CrudPermission, ResourcePermissions, CrudAction } from '@/types/permissions';
import { RESOURCES_CONFIG, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import type { User, Role } from '@/types/auth';

const rolesCollection = 'roles';
const usersCollection = 'users';

export type PermissionTargetType = 'role' | 'user';

/** 
 * Récupère les permissions d'une cible (Rôle ou Utilisateur).
 * Si c'est un utilisateur et qu'il n'a pas de permissions propres, retourne un objet vide.
 * Si c'est un rôle absent, retourne les permissions par défaut.
 */
export async function getResourcePermissions(id: string, type: PermissionTargetType = 'role'): Promise<ResourcePermissions> {
    if (!id) return {};
    const col = type === 'role' ? rolesCollection : usersCollection;
    const ref = doc(db, col, id);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
        const data = snap.data();
        if (data.resourcePermissions) return data.resourcePermissions as ResourcePermissions;
    }
    
    // Si c'est un utilisateur sans permissions propres, on retourne vide (l'héritage gérera la suite)
    if (type === 'user') return {};
    
    // Si c'est un rôle, on retourne les défauts
    return getDefaultPermissions(id);
}

/** Retourne les permissions par défaut pour un rôle. */
export function getDefaultPermissions(roleId: string): ResourcePermissions {
    return DEFAULT_ROLE_PERMISSIONS[roleId] ?? buildEmptyPermissions();
}

/** Construit une matrice vide (tout à false). */
export function buildEmptyPermissions(): ResourcePermissions {
    const result: ResourcePermissions = {};
    for (const r of RESOURCES_CONFIG) {
        result[r.id] = { read: false, create: false, update: false, delete: false };
    }
    return result;
}

/** 
 * Détermine les permissions effectives d'un utilisateur.
 * Logique : Permissions Individuelles > Permissions du Rôle.
 */
export async function getEffectivePermissions(userId: string, roleId: string): Promise<ResourcePermissions> {
    if (!userId) return buildEmptyPermissions();
    
    // 1. Récupérer les permissions du rôle (cache ou DB)
    const rolePermissions = await getResourcePermissions(roleId, 'role');
    
    // 2. Récupérer les surcharges individuelles (cache ou DB)
    const userOverrides = await getResourcePermissions(userId, 'user');
    
    // S'il n'y a pas d'overrides, on prend tout le rôle
    if (!userOverrides || Object.keys(userOverrides).length === 0) {
        return rolePermissions;
    }
    
    // Fusion : Chaque ressource définie au niveau utilisateur remplace celle du rôle
    const effective: ResourcePermissions = { ...rolePermissions };
    
    for (const resourceId in userOverrides) {
        const override = userOverrides[resourceId];
        if (override) {
            effective[resourceId] = override;
        }
    }
    
    return effective;
}

/** Sauvegarde toute la matrice d'une cible (rôle ou utilisateur). */
export async function saveAllResourcePermissions(
    id: string,
    permissions: ResourcePermissions,
    type: PermissionTargetType = 'role'
): Promise<void> {
    const col = type === 'role' ? rolesCollection : usersCollection;
    const ref = doc(db, col, id);
    const snap = await getDoc(ref);
    
    const payload = { resourcePermissions: permissions };
    
    if (snap.exists()) {
        await updateDoc(ref, payload);
    } else {
        await setDoc(ref, payload, { merge: true });
    }
}

/** Supprime les surcharges de permissions d'un utilisateur (reset au rôle). */
export async function clearUserPermissions(userId: string): Promise<void> {
    const ref = doc(db, usersCollection, userId);
    await updateDoc(ref, { 
        resourcePermissions: null 
    });
}

/** Vérifie si un utilisateur a le droit de faire une action sur une ressource. */
export function checkPermission(
    resourcePermissions: ResourcePermissions,
    resource: string,
    action: CrudAction
): boolean {
    const perm = resourcePermissions[resource];
    if (!perm) return false;
    return perm[action] === true;
}

/** Synchronise les défauts pour les rôles (maintenance admin). */
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

/** 
 * Traduit une chaîne de permission ("page:resource:action") en objet CRUD {resourceId, action}.
 * Gère les anciens patterns et les harmonise avec la matrice.
 */
export function mapPermissionToCrud(permission: string): { resourceId: string, action: CrudAction } | null {
    if (!permission || typeof permission !== 'string') return null;
    
    const parts = permission.split(':');
    if (parts.length < 2) return null;
    
    // Cas particuliers ou anciens
    if (permission === 'feature:payroll:view-sensitive') return { resourceId: 'payroll', action: 'read' };
    
  // Logic: "page:users:read" or "users:read" or "feature:payroll:view"
  const resourceId = parts.length >= 3 ? parts[1] : parts[0];
  const actionStr = parts.length >= 3 ? parts[2] : parts[1];
  
  let action: CrudAction = 'read';
    
    switch (actionStr) {
        case 'view':
        case 'read':
            action = 'read';
            break;
        case 'add':
        case 'create':
        case 'import':
            action = 'create';
            break;
        case 'edit':
        case 'update':
        case 'export':
            action = 'update';
            break;
        case 'delete':
            action = 'delete';
            break;
        default:
            action = 'read';
    }
    
    return { resourceId, action };
}

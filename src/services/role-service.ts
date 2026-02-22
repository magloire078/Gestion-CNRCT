

import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, writeBatch, updateDoc, type QueryDocumentSnapshot, type DocumentData } from '@/lib/firebase';
import type { Role } from '@/lib/data';
import { db } from '@/lib/firebase';
import { allPermissions } from '@/lib/permissions';

const rolesCollection = collection(db, 'roles');

const defaultRoles: Omit<Role, 'id'>[] = [
    {
        name: 'Dirigeant (Président)',
        permissions: Object.values(allPermissions)
    },
    {
        name: 'Cadre Supérieur (Directeur)',
        permissions: [
            allPermissions["Accès au Tableau de Bord"],
            allPermissions["Accès à Mon Espace"],
            allPermissions["Gestion des Employés"],
            allPermissions["Gestion des Rois & Chefs"],
            allPermissions["Accès à la Cartographie"],
            allPermissions["Gestion de la Paie"],
            allPermissions["Gestion des Congés"],
            allPermissions["Gestion des Évaluations"],
            allPermissions["Gestion des Indemnités"],
            allPermissions["Gestion des Missions"],
            allPermissions["Gestion du Budget"],
            allPermissions["Gestion des Conflits"],
            allPermissions["Gestion des Fournitures"],
            allPermissions["Gestion des Actifs TI"],
            allPermissions["Gestion de la Flotte"],
            allPermissions["Gestion des Documents"],
            allPermissions["Gestion du Référentiel"],
            allPermissions["Accès à l'Assistant IA"],
            allPermissions["Voir l'Organigramme"],
            allPermissions["Voir le groupe Personnel"],
            allPermissions["Voir le groupe Organisation"],
            allPermissions["Voir le groupe Opérations"],
            allPermissions["Voir le groupe Rapports"],
            allPermissions["Voir le rapport DISA"],
            allPermissions["Voir le rapport Nominatif"],
        ]
    },
    {
        name: 'Cadre Intermédiaire (Chef de service)',
        permissions: [
            allPermissions["Accès au Tableau de Bord"],
            allPermissions["Accès à Mon Espace"],
            allPermissions["Gestion des Employés"],
            allPermissions["Gestion des Congés"],
            allPermissions["Gestion des Missions"],
            allPermissions["Gestion des Fournitures"],
            allPermissions["Accès à l'Assistant IA"],
            allPermissions["Voir l'Organigramme"],
            allPermissions["Voir le groupe Personnel"],
            allPermissions["Voir le groupe Opérations"],
        ]
    },
    {
        name: 'Employé Opérationnel',
        permissions: [
            allPermissions["Accès au Tableau de Bord"],
            allPermissions["Accès à Mon Espace"],
            allPermissions["Accès à l'Assistant IA"],
        ]
    },
    {
        name: 'Stagiaire / Apprenti',
        permissions: [
            allPermissions["Accès à Mon Espace"],
        ]
    }
];


export async function initializeDefaultRoles() {
    const snapshot = await getDocs(rolesCollection);
    if (snapshot.empty) {
        console.log("No roles found, initializing default roles...");
        const batch = writeBatch(db);
        const roleIds = [
            'dirigeant-president',
            'cadre-superieur-directeur',
            'cadre-intermediaire-chef-service',
            'employe-operationnel',
            'stagiaire-apprenti'
        ];

        defaultRoles.forEach((role, index) => {
            const roleRef = doc(db, 'roles', roleIds[index]);
            batch.set(roleRef, { name: role.name, permissions: role.permissions });
        });
        await batch.commit();
        console.log("Default roles initialized.");
    }
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

export async function getRoles(): Promise<Role[]> {
    const snapshot = await getDocs(query(rolesCollection, orderBy("name", "asc")));
    if (snapshot.empty) {
        await initializeDefaultRoles();
        const newSnapshot = await getDocs(query(rolesCollection, orderBy("name", "asc")));
        return newSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Role));
    }
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
    } as Role));
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

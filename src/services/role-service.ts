
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { Role } from '@/lib/data';
import { db } from '@/lib/firebase';
import { allPermissions } from '@/lib/permissions';

const rolesCollection = collection(db, 'roles');

const defaultRoles: Role[] = [
    { 
        id: 'administrateur',
        name: 'Administrateur', 
        permissions: Object.values(allPermissions)
    },
    { 
        id: 'employe',
        name: 'Employé', 
        permissions: [
            allPermissions["Accès au Tableau de Bord"],
            allPermissions["Gestion des Congés"],
            allPermissions["Accès à l'Assistant IA"],
        ]
    },
    {
        id: 'manager-rh',
        name: 'Manager RH',
        permissions: [
            allPermissions["Accès au Tableau de Bord"],
            allPermissions["Gestion des Employés"],
            allPermissions["Gestion de la Paie"],
            allPermissions["Gestion des Congés"],
            allPermissions["Gestion des Évaluations"],
            allPermissions["Gestion des Missions"],
            allPermissions["Gestion des Documents"],
        ]
    }
];

export async function initializeDefaultRoles() {
    const snapshot = await getDocs(rolesCollection);
    if (snapshot.empty) {
        console.log("No roles found, initializing default roles...");
        const batch = writeBatch(db);
        defaultRoles.forEach(role => {
            const roleRef = doc(db, 'roles', role.id);
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
            const roles = snapshot.docs.map(doc => ({
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
      return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
  }
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Role));
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const docRef = await addDoc(rolesCollection, roleDataToAdd);
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


import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, writeBatch } from 'firebase/firestore';
import type { Role } from '@/lib/data';

// Default roles and permissions
const defaultRoles: { id: string; data: Omit<Role, 'id'> }[] = [
    { 
        id: 'administrateur',
        data: {
            name: 'Administrateur', 
            permissions: [
                "page:dashboard:view", "page:employees:view", "page:payroll:view",
                "page:leave:view", "page:missions:view", "page:conflicts:view",
                "page:supplies:view", "page:it-assets:view", "page:fleet:view",
                "page:documents:view", "page:assistant:view", "page:admin:view",
                "page:chiefs:view", "page:mapping:view"
            ] 
        }
    },
    { 
        id: 'employe',
        data: {
            name: 'Employé', 
            permissions: [
                "page:dashboard:view", "page:leave:view", "page:documents:view", "page:assistant:view"
            ] 
        }
    },
    {
        id: 'manager-rh',
        data: {
            name: 'Manager RH',
            permissions: [
                "page:dashboard:view", "page:employees:view", "page:payroll:view",
                "page:leave:view", "page:missions:view", "page:conflicts:view",
                "page:documents:view", "page:assistant:view", "page:chiefs:view", "page:mapping:view"
            ]
        }
    }
];

// Function to initialize default roles if they don't exist
export async function initializeDefaultRoles() {
    const rolesCollection = collection(db, 'roles');
    const roleSnapshot = await getDocs(rolesCollection);
    
    if (roleSnapshot.empty) {
        console.log("No roles found, initializing default roles...");
        const batch = writeBatch(db);
        for (const role of defaultRoles) {
            const roleRef = doc(rolesCollection, role.id);
            batch.set(roleRef, role.data);
        }
        await batch.commit();
        console.log("Default roles initialized.");
    }
}


export function subscribeToRoles(
    callback: (roles: Role[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const rolesCollection = collection(db, 'roles');
    const q = query(rolesCollection, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const roleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
        callback(roleList);
    }, (error) => {
        console.error("Error subscribing to roles:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getRoles(): Promise<Role[]> {
  const rolesCollection = collection(db, 'roles');
  const roleSnapshot = await getDocs(rolesCollection);
  if (roleSnapshot.empty) {
      await initializeDefaultRoles();
      const newSnapshot = await getDocs(rolesCollection);
      return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
  }
  const roleList = roleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
  return roleList;
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const roleId = roleDataToAdd.name.toLowerCase().replace(/\s+/g, '-');
    const roleRef = doc(db, 'roles', roleId);
    await setDoc(roleRef, roleDataToAdd);
    const newRole: Role = { 
        id: roleId, 
        ...roleDataToAdd 
    };
    return newRole;
}

export async function deleteRole(roleId: string): Promise<void> {
    const roleRef = doc(db, 'roles', roleId);
    await deleteDoc(roleRef);
}


import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Role } from '@/lib/data';

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
  const roleList = roleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
  return roleList;
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const rolesCollection = collection(db, 'roles');
    const docRef = await addDoc(rolesCollection, roleDataToAdd);
    const newRole: Role = { 
        id: docRef.id, 
        ...roleDataToAdd 
    };
    return newRole;
}

export async function deleteRole(roleId: string): Promise<void> {
    const roleRef = doc(db, 'roles', roleId);
    await deleteDoc(roleRef);
}

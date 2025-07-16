
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Role } from '@/lib/data';

const rolesCollection = collection(db, 'roles');

export async function getRoles(): Promise<Role[]> {
  const snapshot = await getDocs(rolesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Role));
}

export async function addRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    const docRef = await addDoc(rolesCollection, roleData);
    return { id: docRef.id, ...roleData };
}

export async function deleteRole(roleId: string): Promise<void> {
    const roleDoc = doc(db, 'roles', roleId);
    await deleteDoc(roleDoc);
}

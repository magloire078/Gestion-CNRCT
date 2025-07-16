
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Role } from '@/lib/data';

export async function getRoles(): Promise<Role[]> {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return [];
  }
  const rolesCollection = collection(db, 'roles');
  const snapshot = await getDocs(rolesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Role));
}

export async function addRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    if (!db) {
      throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const rolesCollection = collection(db, 'roles');
    const docRef = await addDoc(rolesCollection, roleData);
    return { id: docRef.id, ...roleData };
}

export async function deleteRole(roleId: string): Promise<void> {
    if (!db) {
      throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const roleDoc = doc(db, 'roles', roleId);
    await deleteDoc(roleDoc);
}

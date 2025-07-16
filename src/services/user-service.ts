
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';

const usersCollection = collection(db, 'users');

export async function getUsers(): Promise<User[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    const docRef = await addDoc(usersCollection, userData);
    return { id: docRef.id, ...userData };
}

export async function deleteUser(userId: string): Promise<void> {
    const userDoc = doc(db, 'users', userId);
    await deleteDoc(userDoc);
}

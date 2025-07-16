
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';

export async function getUsers(): Promise<User[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    if (snapshot.empty) {
        console.log("No users found in the 'users' collection.");
        return [];
    }
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as User));
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty array to prevent crashing the UI
    return [];
  }
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    if (!db) {
      throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const usersCollection = collection(db, 'users');
    const docRef = await addDoc(usersCollection, userData);
    return { id: docRef.id, ...userData };
}

export async function deleteUser(userId: string): Promise<void> {
    if (!db) {
      throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const userDoc = doc(db, 'users', userId);
    await deleteDoc(userDoc);
}

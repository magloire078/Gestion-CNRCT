
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';

// Note: This service now deals with user data in Firestore, not Firebase Auth users.
// Auth-related user creation is in auth-service.ts.

export function subscribeToUsers(
    callback: (users: User[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(userList);
    }, (error) => {
        console.error("Error subscribing to users:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getUsers(): Promise<User[]> {
  const usersCollection = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollection);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  return userList;
}

export async function addUser(userDataToAdd: Omit<User, 'id' | 'role' | 'permissions'>): Promise<User> {
    const usersCollection = collection(db, 'users');
    // In a real app, adding a user would likely involve Firebase Auth Cloud Functions
    // to create the auth user and then this record. Here we just add the Firestore record.
    const docRef = await addDoc(usersCollection, userDataToAdd);
    const newUser: User = { 
        id: docRef.id, 
        ...userDataToAdd,
        role: null, // Role needs to be fetched separately
        permissions: [] 
    };
    return newUser;
}

export async function deleteUser(userId: string): Promise<void> {
    // Note: This does not delete the user from Firebase Auth, only from the 'users' collection.
    // A cloud function would be needed for a full cleanup.
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}


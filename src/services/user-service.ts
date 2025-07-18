
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/data';

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

export async function addUser(userDataToAdd: Omit<User, 'id'>): Promise<User> {
    const usersCollection = collection(db, 'users');
    const docRef = await addDoc(usersCollection, userDataToAdd);
    const newUser: User = { 
        id: docRef.id, 
        ...userDataToAdd 
    };
    return newUser;
}

export async function deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

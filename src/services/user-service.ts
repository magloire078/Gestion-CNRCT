
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { User } from '@/lib/data';


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

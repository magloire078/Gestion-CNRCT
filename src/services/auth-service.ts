
"use client";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';

// Sign Up
export async function signUp(userData: Omit<User, 'id'>, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const firebaseUser = userCredential.user;

    const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role
    };

    // Save additional user data to Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    return newUser;
}

// Sign In
export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Fetch the full user profile from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!userDoc.exists()) {
        throw new Error("Profil utilisateur non trouvé dans la base de données.");
    }

    return userDoc.data() as User;
}

// Sign Out
export async function signOut(): Promise<void> {
    return firebaseSignOut(auth);
}

// Auth State Listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // User is signed in, get full profile from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as User);
      } else {
        // This case might happen if Firestore data is deleted but auth record remains.
        callback(null);
      }
    } else {
      // User is signed out
      callback(null);
    }
  });
}


"use client";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
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
    
    // Fetch the full user profile from Firestore to ensure they are a valid app user
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!userDoc.exists()) {
        // Log out the user from Firebase Auth as they don't have a profile in our app
        await firebaseSignOut(auth);
        throw new Error("Aucun profil utilisateur correspondant à cet email n'a été trouvé. Veuillez vous inscrire d'abord.");
    }

    return userDoc.data() as User;
}

// Sign Out
export async function signOut(): Promise<void> {
    return firebaseSignOut(auth);
}

// Password Reset
export async function sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email);
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
        // Or if a user from another Firebase project with the same auth instance tries to log in.
        // We ensure they are logged out and treated as a non-user.
        await firebaseSignOut(auth);
        callback(null);
      }
    } else {
      // User is signed out
      callback(null);
    }
  });
}

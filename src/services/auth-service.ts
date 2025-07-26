
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
import type { User, Role } from '@/lib/data';

// Sign Up
export async function signUp(userData: { name: string, email: string, role?: string }, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const firebaseUser = userCredential.user;

    // For simplicity, new users get a default roleId. In a real app, this might be different.
    // Let's assume an "Employé" role with id 'employee-role-id' exists.
    const defaultRoleId = "employe"; 

    const newUser: Omit<User, 'id' | 'role' | 'permissions'> = {
        name: userData.name,
        email: userData.email,
        roleId: defaultRoleId,
    };

    // Save additional user data to Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    // Fetch the full user profile to return
    const userProfile = await getFullUserProfile(firebaseUser);
    if (!userProfile) throw new Error("Could not create user profile.");
    return userProfile;
}

// Sign In
export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const userProfile = await getFullUserProfile(firebaseUser);
    if (!userProfile) {
        await firebaseSignOut(auth);
        throw new Error("Aucun profil utilisateur correspondant à cet email n'a été trouvé.");
    }

    return userProfile;
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
      const userProfile = await getFullUserProfile(firebaseUser);
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}


async function getFullUserProfile(firebaseUser: FirebaseUser): Promise<User | null> {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        return null;
    }

    const userData = userDoc.data() as Omit<User, 'id' | 'role' | 'permissions'>;
    
    let role: Role | null = null;
    let permissions: string[] = [];

    if (userData.roleId) {
        const roleRef = doc(db, "roles", userData.roleId);
        const roleDoc = await getDoc(roleRef);
        if (roleDoc.exists()) {
            role = { id: roleDoc.id, ...roleDoc.data() } as Role;
            permissions = role.permissions || [];
        }
    }

    return {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        roleId: userData.roleId,
        role,
        permissions,
    };
}


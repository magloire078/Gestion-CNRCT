
"use client";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    type User as FirebaseUser
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { User, Role } from '@/lib/data';
import { initializeDefaultRoles } from './role-service';

// Sign Up
export async function signUp(userData: { name: string, email: string }, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const firebaseUser = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(firebaseUser, { displayName: userData.name });

    const defaultRoleId = "employé"; 

    const newUser: Omit<User, 'id' | 'role' | 'permissions' | 'photoUrl'> = {
        name: userData.name,
        email: userData.email,
        roleId: defaultRoleId,
    };

    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    const userProfile = await getFullUserProfile(firebaseUser);
    if (!userProfile) {
        // This case should ideally not happen if Firestore write is successful
        throw new Error("La création du profil utilisateur a échoué après l'inscription.");
    }
    return userProfile;
}

// Sign In
export async function signIn(email: string, password: string): Promise<User> {
    await initializeDefaultRoles(); // Ensure roles exist before sign-in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    let userProfile = await getFullUserProfile(firebaseUser);

    // If profile doesn't exist in Firestore, create it "just-in-time"
    if (!userProfile) {
        console.log(`User profile for ${email} not found in Firestore. Creating one.`);
        try {
            const defaultRoleId = "employé";
            const newUserProfileData = {
                name: firebaseUser.displayName || email.split('@')[0],
                email: firebaseUser.email!,
                roleId: defaultRoleId,
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUserProfileData);
            userProfile = await getFullUserProfile(firebaseUser); // Re-fetch the newly created profile

            if (!userProfile) {
                 // This is a critical failure state. The profile could not be created or fetched.
                 throw new Error("User profile could not be created or loaded after creation.");
            }
        } catch(error) {
             console.error("Critical error: Failed to create user profile on-the-fly.", error);
             await firebaseSignOut(auth); // Sign out the user to prevent an inconsistent state
             throw new Error("profile-creation-failed");
        }
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

// Update User Profile
export async function updateUserProfile(userId: string, data: { name?: string, photoFile?: File | null }): Promise<void> {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) throw new Error("Not authorized");

    let photoURL = user.photoURL;

    // Handle photo upload
    if (data.photoFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile_pictures/${userId}`);
        await uploadBytes(storageRef, data.photoFile);
        photoURL = await getDownloadURL(storageRef);
    }

    // Update Firebase Auth profile
    await updateProfile(user, { displayName: data.name, photoURL });
    
    // Update Firestore user document
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { name: data.name, photoUrl: photoURL });
}


// Change Password
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Utilisateur non authentifié.");
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
            throw new Error("Le mot de passe actuel est incorrect.");
        }
        throw new Error("Une erreur est survenue lors du changement de mot de passe.");
    }
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
        name: firebaseUser.displayName || userData.name,
        email: firebaseUser.email!,
        photoUrl: firebaseUser.photoURL || userData.photoUrl || '',
        roleId: userData.roleId,
        role,
        permissions,
    };
}

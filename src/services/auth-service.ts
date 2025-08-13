

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
import { getRoles, initializeDefaultRoles } from './role-service';

// --- Real Auth Service ---

async function getUserProfile(userId: string): Promise<User | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        return null;
    }
    const roles = await getRoles();
    const userData = userDoc.data() as Omit<User, 'id' | 'role' | 'permissions'>;
    const userRole = roles.find(r => r.id === userData.roleId) || null;

    return {
        id: userId,
        ...userData,
        role: userRole,
        permissions: userRole?.permissions || []
    };
}

async function createUserProfile(user: FirebaseUser, name: string): Promise<User> {
    const userDocRef = doc(db, 'users', user.uid);
    
    // Assign 'administrateur' role if the email matches the super admin email
    const superAdminEmail = "magloire078@gmail.com";
    const assignedRoleId = user.email === superAdminEmail ? 'administrateur' : 'employe';

    const userProfile: Omit<User, 'id' | 'role' | 'permissions'> = {
        name,
        email: user.email!,
        roleId: assignedRoleId,
        photoUrl: user.photoURL || '',
    };
    await setDoc(userDocRef, userProfile);
    
    // Now fetch the full profile with role
    return (await getUserProfile(user.uid))!;
}

export async function signUp(userData: { name: string, email: string }, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const { user } = userCredential;
    
    await updateProfile(user, { displayName: userData.name });

    try {
        await initializeDefaultRoles();
        const userProfile = await createUserProfile(user, userData.name);
        return userProfile;
    } catch (profileError) {
        // If profile creation fails, we should ideally handle this,
        // maybe by deleting the auth user or flagging the account.
        console.error("Profile creation failed after signup:", profileError);
        throw new Error("profile-creation-failed");
    }
}

export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    let userProfile = await getUserProfile(user.uid);
    
    // Just-in-time profile creation if it doesn't exist
    if (!userProfile) {
        console.warn(`User profile not found for uid: ${user.uid}. Creating one now.`);
        try {
            await initializeDefaultRoles();
            userProfile = await createUserProfile(user, user.displayName || user.email!);
        } catch(profileError) {
            console.error("Just-in-time profile creation failed:", profileError);
            throw new Error("profile-creation-failed");
        }
    }
    
    return userProfile;
}

export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await getUserProfile(firebaseUser.uid);
            callback(userProfile);
        } else {
            callback(null);
        }
    });
}

export async function updateUserProfile(userId: string, data: { name?: string, photoFile?: File | null }): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
         throw new Error("You are not authorized to perform this action.");
    }
    
    const userDocRef = doc(db, 'users', userId);
    const updateData: Partial<User> = {};

    if (data.name) {
        updateData.name = data.name;
    }

    if (data.photoFile) {
        const storage = getStorage();
        const photoRef = ref(storage, `user_photos/${userId}/${data.photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, data.photoFile);
        const photoUrl = await getDownloadURL(snapshot.ref);
        updateData.photoUrl = photoUrl;
    }
    
    await updateDoc(userDocRef, updateData);

    // Also update the auth profile if possible
    if(auth.currentUser){
       const authUpdate: {displayName?: string, photoURL?: string} = {};
       if (updateData.name) authUpdate.displayName = updateData.name;
       if (updateData.photoUrl) authUpdate.photoURL = updateData.photoUrl;

       if (Object.keys(authUpdate).length > 0) {
            await updateProfile(auth.currentUser, authUpdate);
       }
    }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Utilisateur non authentifié.");
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch(error: any) {
        if (error.code === 'auth/wrong-password') {
            throw new Error("Le mot de passe actuel est incorrect.");
        }
        throw new Error("Une erreur est survenue lors du changement de mot de passe.");
    }
}

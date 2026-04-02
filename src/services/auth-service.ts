

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
import { uploadToCloudinary } from '@/lib/cloudinary';
import { doc, setDoc, getDoc, updateDoc } from '@/lib/firebase';
import type { User, Role } from '@/lib/data';
import { getRoles, initializeDefaultRoles } from './role-service';

// --- Real Auth Service ---

async function getUserProfile(userId: string): Promise<User | null> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            return null;
        }
        const roles = await getRoles();
        const userData = userDoc.data() as User;
        const userRole = roles.find(r => r.id === userData.roleId) || null;
        const userResourcePermissions = userData.resourcePermissions || {};

        return {
            ...userData,
            id: userId,
            role: userRole,
            permissions: userRole?.permissions || [],
            resourcePermissions: userResourcePermissions
        };
    } catch (error) {
        // Silently handle permission errors during initial auth state changes
        // This can happen before the user is fully authenticated
        console.warn(`[AuthService] Could not fetch user profile for ${userId}:`, error);
        return null;
    }
}

async function createUserProfile(user: FirebaseUser, name: string, preProvisionedData: any = null): Promise<User> {
    const userDocRef = doc(db, 'users', user.uid);

    // Ensure default roles are present before assigning one
    try {
        await initializeDefaultRoles();
    } catch (e) {
        console.warn("Could not initialize default roles during profile creation:", e);
    }

    // Assign 'Employé Opérationnel' role by default for new signups, unless pre-provisioned
    const assignedRoleId = preProvisionedData?.roleId || 'employe-operationnel';

    const userProfile: any = {
        name: preProvisionedData?.name || name,
        email: user.email!,
        roleId: assignedRoleId,
        photoUrl: preProvisionedData?.photoUrl || user.photoURL || '',
    };

    // Copy any explicit relations from pre-provisioned data
    if (preProvisionedData?.employeeId) {
        userProfile.employeeId = preProvisionedData.employeeId;
    }

    await setDoc(userDocRef, userProfile);

    // Now fetch the full profile with role
    return (await getUserProfile(user.uid))!;
}

export async function signUp(userData: { name: string, email: string }, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const { user } = userCredential;

    await updateProfile(user, { displayName: userData.name });

    try {
        // Check for pre-provisioned profile by email
        const { collection, getDocs, query, where } = await import('@/lib/firebase');
        const q = query(collection(db, 'users'), where('email', '==', userData.email));
        const querySnapshot = await getDocs(q);
        let preProvisionedData = null;
        let oldDocId = null;

        if (!querySnapshot.empty) {
            const oldDoc = querySnapshot.docs.find(d => d.id !== user.uid);
            if (oldDoc) {
                preProvisionedData = oldDoc.data();
                oldDocId = oldDoc.id;
            }
        }

        const userProfile = await createUserProfile(user, userData.name, preProvisionedData);

        // Try to delete old pre-provisioned doc if it exists
        if (oldDocId) {
            try {
                const { deleteDoc, updateDoc } = await import('@/lib/firebase');
                if (preProvisionedData?.employeeId) {
                    await updateDoc(doc(db, 'employees', preProvisionedData.employeeId), {
                        userId: user.uid
                    });
                }
                await deleteDoc(doc(db, 'users', oldDocId));
            } catch (e) {
                console.warn("Could not delete old pre-provisioned doc (requires admin rights) or update employee:", e);
            }
        }

        return userProfile;
    } catch (profileError) {
        // If profile creation fails, we should ideally handle this,
        // maybe by deleting the auth user or flagging the account.
        console.error("Profile creation failed after signup:", profileError);
        throw new Error("profile-creation-failed");
    }
}

export async function signIn(email: string, password: string): Promise<User> {
    try {
        const { isConfigValid } = await import('@/lib/firebase');
        if (!isConfigValid) {
            throw new Error("Firebase configuration is missing");
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        let userProfile = await getUserProfile(user.uid);

        // Just-in-time profile creation if profile doesn't exist
        if (!userProfile) {
            // Before creating, verify the document truly doesn't exist.
            // getUserProfile() can return null both when the doc is missing AND
            // when it fails silently due to permission errors (e.g. on roles collection).
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // Truly new user — create profile
                console.warn(`User profile not found for uid: ${user.uid}. Creating one now.`);
                try {
                    // Check if admin pre-provisioned this user
                    const { collection, getDocs, query, where, deleteDoc } = await import('@/lib/firebase');
                    const q = query(collection(db, 'users'), where('email', '==', user.email));
                    const querySnapshot = await getDocs(q);

                    let preProvisionedData = null;
                    let oldDocId = null;
                    if (!querySnapshot.empty) {
                        const oldDoc = querySnapshot.docs.find(d => d.id !== user.uid);
                        if (oldDoc) {
                            preProvisionedData = oldDoc.data();
                            oldDocId = oldDoc.id;
                            console.warn(`Found pre-provisioned profile for ${user.email} (doc: ${oldDocId}), migrating to ${user.uid}`);
                        }
                    }

                    userProfile = await createUserProfile(user, user.displayName || user.email!, preProvisionedData);

                    if (oldDocId) {
                        try {
                            const { deleteDoc, updateDoc } = await import('@/lib/firebase');
                            if (preProvisionedData?.employeeId) {
                                await updateDoc(doc(db, 'employees', preProvisionedData.employeeId), {
                                    userId: user.uid
                                });
                            }
                            await deleteDoc(doc(db, 'users', oldDocId));
                        } catch (e) {
                            console.warn("Could not delete old pre-provisioned doc or update employee:", e);
                        }
                    }
                } catch (profileError) {
                    console.error("Just-in-time profile creation failed:", profileError);
                    throw new Error("profile-creation-failed");
                }
            } else {
                // Profile doc exists but role/permissions couldn't be loaded.
                // Build a minimal profile from raw document data.
                console.warn(`Profile doc exists for ${user.uid} but role couldn't be resolved. Using minimal profile.`);
                const rawData = userDocSnap.data();
                userProfile = {
                    id: user.uid,
                    name: rawData.name || user.displayName || user.email!,
                    email: rawData.email || user.email!,
                    roleId: rawData.roleId || '',
                    photoUrl: rawData.photoUrl || user.photoURL || '',
                    role: null,
                    permissions: [],
                };
            }
        }

        return userProfile;
    } catch (error: any) {
        console.error("[AuthService] SignIn Error:", {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack,
            errorObject: error
        });
        throw error;
    }
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
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
        throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
    }

    const userDocRef = doc(db, 'users', userId);
    const updateData: Partial<User> = {};
    let newPhotoURL: string | undefined = undefined;

    if (data.name) {
        updateData.name = data.name;
    }

    if (data.photoFile) {
        newPhotoURL = await uploadToCloudinary(data.photoFile);
        updateData.photoUrl = newPhotoURL;
    }

    if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
    }

    // Also update the auth profile if possible
    const authUpdate: { displayName?: string, photoURL?: string } = {};
    if (updateData.name) authUpdate.displayName = updateData.name;
    if (newPhotoURL) authUpdate.photoURL = newPhotoURL;

    if (Object.keys(authUpdate).length > 0) {
        await updateProfile(user, authUpdate);
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
    } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
            throw new Error("Le mot de passe actuel est incorrect.");
        }
        throw new Error("Une erreur est survenue lors du changement de mot de passe.");
    }
}

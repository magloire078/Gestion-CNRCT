
"use client";

// import { auth, db } from '@/lib/firebase'; // Temporarily disabled
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

// --- Mock Auth Service ---
let mockAuthUser: User | null = {
    id: 'user1',
    name: 'Magloire Dja',
    email: 'magloire078@gmail.com',
    photoUrl: 'https://placehold.co/100x100.png',
    roleId: 'administrateur',
    role: { id: 'administrateur', name: 'Administrateur', permissions: [] }, // Role will be enriched later
    permissions: [], // Permissions will be enriched later
};

const mockUsersDb: User[] = [mockAuthUser];


export async function signUp(userData: { name: string, email: string }, password: string): Promise<User> {
    const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        roleId: 'employe', // Default role
        role: null,
        permissions: [],
        photoUrl: '',
    };
    mockUsersDb.push(newUser);
    mockAuthUser = newUser;
    return Promise.resolve(newUser);
}

export async function signIn(email: string, password: string): Promise<User> {
    if (email === 'magloire078@gmail.com' && password) {
        mockAuthUser = mockUsersDb[0];
        return Promise.resolve(mockAuthUser);
    }
    const foundUser = mockUsersDb.find(u => u.email === email);
    if (foundUser) {
        mockAuthUser = foundUser;
        return Promise.resolve(foundUser);
    }
    return Promise.reject(new Error("auth/invalid-credential"));
}

export async function signOut(): Promise<void> {
    mockAuthUser = null;
    return Promise.resolve();
}

export async function sendPasswordReset(email: string): Promise<void> {
    console.log(`Password reset link sent to (mock) ${email}`);
    return Promise.resolve();
}

export function onAuthStateChange(callback: (user: User | null) => void) {
    const enrichUser = async () => {
        if (mockAuthUser) {
            const roles = await getRoles();
            const userRole = roles.find(r => r.id === mockAuthUser?.roleId);
            if (userRole) {
                mockAuthUser.role = userRole;
                mockAuthUser.permissions = userRole.permissions;
            }
        }
        callback(mockAuthUser);
    }
    enrichUser();
    return () => {}; // Unsubscribe function
}

export async function updateUserProfile(userId: string, data: { name?: string, photoFile?: File | null }): Promise<void> {
    if (mockAuthUser && mockAuthUser.id === userId) {
        if (data.name) mockAuthUser.name = data.name;
        if (data.photoFile) {
           mockAuthUser.photoUrl = URL.createObjectURL(data.photoFile);
        }
    }
    return Promise.resolve();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    console.log("Password changed (mock)");
    return Promise.resolve();
}

// --- End Mock Auth Service ---

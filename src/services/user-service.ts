
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, updateDoc } from 'firebase/firestore';
import type { User, Role } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getRoles } from './role-service';

const usersCollection = collection(db, 'users');

export function subscribeToUsers(
    callback: (users: User[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(usersCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        async (snapshot) => {
            const roles = await getRoles();
            const rolesMap = new Map(roles.map(r => [r.id, r]));

            const users = snapshot.docs.map(doc => {
                const userData = doc.data() as Omit<User, 'id'>;
                const role = rolesMap.get(userData.roleId) || null;
                return {
                    id: doc.id,
                    ...userData,
                    role: role,
                    permissions: role?.permissions || [],
                } as User;
            });
            callback(users);
        },
        (error) => {
            console.error("Error subscribing to users:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getUsers(): Promise<User[]> {
    const snapshot = await getDocs(query(usersCollection, orderBy("name", "asc")));
    const roles = await getRoles();
    const rolesMap = new Map(roles.map(r => [r.id, r]));
    
    return snapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        const role = rolesMap.get(userData.roleId) || null;
        return {
            id: doc.id,
            ...userData,
            role: role,
            permissions: role?.permissions || [],
        } as User;
    });
}

export async function addUser(userDataToAdd: Omit<User, 'id' | 'role' | 'permissions'>): Promise<User> {
    // Note: This adds the user profile to Firestore. It does not create the auth user.
    // This is typically for pre-provisioning an account.
    const newUserRef = doc(usersCollection);
    await setDoc(newUserRef, userDataToAdd);
    
    const role = (await getRoles()).find(r => r.id === userDataToAdd.roleId) || null;

    return { 
        id: newUserRef.id,
        ...userDataToAdd,
        role: role,
        permissions: role?.permissions || []
    };
}

export async function updateUser(userId: string, dataToUpdate: Partial<Omit<User, 'id'>>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, dataToUpdate);
}

export async function deleteUser(userId: string): Promise<void> {
    // This only deletes the Firestore profile. The auth user must be deleted separately.
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
}

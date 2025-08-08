
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc } from 'firebase/firestore';
import type { User, Role } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// --- Mock Data ---
const mockUsers: User[] = [
    { id: 'user1', name: 'Magloire Dja', email: 'magloire078@gmail.com', roleId: 'administrateur', role: null, permissions: [] },
    { id: 'user2', name: 'Employé de Test', email: 'employe@test.com', roleId: 'employe', role: null, permissions: [] },
];
// --- End Mock Data ---


export function subscribeToUsers(
    callback: (users: User[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockUsers), 5000);
    return () => clearInterval(interval);
}

export async function getUsers(): Promise<User[]> {
  return Promise.resolve(mockUsers);
}

export async function addUser(userDataToAdd: Omit<User, 'id' | 'role' | 'permissions'>): Promise<User> {
    const newUser: User = { 
        id: `user-${Date.now()}`,
        ...userDataToAdd,
        role: null,
        permissions: [] 
    };
    mockUsers.push(newUser);
    return Promise.resolve(newUser);
}

export async function deleteUser(userId: string): Promise<void> {
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index > -1) {
        mockUsers.splice(index, 1);
    }
    return Promise.resolve();
}

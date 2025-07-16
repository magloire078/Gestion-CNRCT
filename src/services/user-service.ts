
import type { User } from '@/lib/data';
import { userData } from '@/lib/data';

export async function getUsers(): Promise<User[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(userData);
}

export async function addUser(userDataToAdd: Omit<User, 'id'>): Promise<User> {
    const newUser: User = { 
        id: `USR${Math.floor(Math.random() * 1000)}`, 
        ...userDataToAdd 
    };
    userData.push(newUser);
    return Promise.resolve(newUser);
}

export async function deleteUser(userId: string): Promise<void> {
    const index = userData.findIndex(user => user.id === userId);
    if (index > -1) {
        userData.splice(index, 1);
    }
    return Promise.resolve();
}

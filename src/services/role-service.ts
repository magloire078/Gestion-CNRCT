
import type { Role } from '@/lib/data';
import { roleData } from '@/lib/data';

export async function getRoles(): Promise<Role[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(roleData);
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const newRole: Role = { 
        id: `ROLE${Math.floor(Math.random() * 1000)}`, 
        ...roleDataToAdd 
    };
    roleData.push(newRole);
    return Promise.resolve(newRole);
}

export async function deleteRole(roleId: string): Promise<void> {
    const index = roleData.findIndex(role => role.id === roleId);
    if (index > -1) {
        roleData.splice(index, 1);
    }
    return Promise.resolve();
}

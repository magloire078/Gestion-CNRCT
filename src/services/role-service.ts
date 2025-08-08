
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, Unsubscribe, query, orderBy, setDoc, writeBatch } from 'firebase/firestore';
import type { Role } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// Default roles and permissions
const mockRoles: Role[] = [
    { 
        id: 'administrateur',
        name: 'Administrateur', 
        permissions: [
            "page:dashboard:view", "page:employees:view", "page:payroll:view",
            "page:leave:view", "page:missions:view", "page:conflicts:view",
            "page:supplies:view", "page:it-assets:view", "page:fleet:view",
            "page:documents:view", "page:assistant:view", "page:admin:view",
            "page:chiefs:view", "page:mapping:view", "page:evaluations:view"
        ] 
    },
    { 
        id: 'employe',
        name: 'Employé', 
        permissions: [
            "page:dashboard:view", "page:leave:view", "page:documents:view", "page:assistant:view"
        ] 
    },
    {
        id: 'manager-rh',
        name: 'Manager RH',
        permissions: [
            "page:dashboard:view", "page:employees:view", "page:payroll:view",
            "page:leave:view", "page:missions:view", "page:conflicts:view",
            "page:documents:view", "page:assistant:view", "page:chiefs:view", "page:mapping:view",
            "page:evaluations:view"
        ]
    }
];

// This function is now a no-op as we use mock data.
export async function initializeDefaultRoles() {
    return Promise.resolve();
}

export function subscribeToRoles(
    callback: (roles: Role[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockRoles), 5000);
    return () => clearInterval(interval);
}

export async function getRoles(): Promise<Role[]> {
  return Promise.resolve(mockRoles);
}

export async function addRole(roleDataToAdd: Omit<Role, 'id'>): Promise<Role> {
    const newRole: Role = { 
        id: `role-${Date.now()}`, 
        ...roleDataToAdd 
    };
    mockRoles.push(newRole);
    return Promise.resolve(newRole);
}

export async function deleteRole(roleId: string): Promise<void> {
    const index = mockRoles.findIndex(r => r.id === roleId);
    if (index > -1) {
        mockRoles.splice(index, 1);
    }
    return Promise.resolve();
}

import type { Timestamp } from 'firebase/firestore';
import type { ResourcePermissions } from './permissions';

export type User = {
    id: string; // Firestore document ID from auth
    name: string;
    email: string;
    photoUrl?: string; // URL to the profile picture in Firebase Storage
    roleId: string; // Reference to a role document in the 'roles' collection
    role: Role | null; // The resolved role object
    permissions: string[]; // The resolved permissions for the user's role (legacy)
    resourcePermissions?: ResourcePermissions; // Matrix permissions (new)
    employeeId?: string; // ID de l'employé lié
    departmentId?: string; // ID du département (depuis l'employé lié)
    directionId?: string; // ID de la direction (depuis l'employé lié)
    serviceId?: string; // ID du service (depuis l'employé lié)
    lastActive?: Timestamp; // Dernière activité de l'utilisateur
    isOnline?: boolean; // Statut en ligne
}

export type Role = {
    id: string; // Firestore document ID
    name: string;
    permissions: string[]; // Legacy permissions
    resourcePermissions?: ResourcePermissions; // New CRUD matrix
}

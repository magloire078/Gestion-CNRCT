export type User = {
    id: string; // Firestore document ID from auth
    name: string;
    email: string;
    photoUrl?: string; // URL to the profile picture in Firebase Storage
    roleId: string; // Reference to a role document in the 'roles' collection
    role: Role | null; // The resolved role object
    permissions: string[]; // The resolved permissions for the user's role
    employeeId?: string; // ID de l'employé lié
}

export type Role = {
    id: string; // Firestore document ID
    name: string;
    permissions: string[];
}

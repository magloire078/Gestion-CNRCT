
export type Employee = {
  id: string; // Firestore document ID
  matricule: string;
  name: string; // Combined name
  firstName?: string; // Optional for backward compatibility
  lastName?: string;  // Optional for backward compatibility
  email?: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  photoUrl: string; // Can be a data URL or a gs:// URL
};

export type Leave = {
  id: string; // Firestore document ID
  employee: string; // Employee name
  type: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Approved' | 'Pending' | 'Rejected';
};

export type Asset = {
  tag: string; // Firestore document ID
  type: string;
  model: string;
  assignedTo: string;
  status: 'In Use' | 'In Stock' | 'In Repair' | 'Retired' | 'Active';
}

export type Fleet = {
  plate: string; // Firestore document ID
  makeModel: string;
  assignedTo: string;
  maintenanceDue: string; // YYYY-MM-DD
};

export type User = {
    id: string; // Firestore document ID
    name: string; // Combined name
    firstName?: string; // Optional for backward compatibility
    lastName?: string;  // Optional for backward compatibility
    email: string;
    role: 'Admin' | 'Manager' | 'Employé';
}

export type Role = {
    id: string; // Firestore document ID
    name: string;
    permissions: string[];
}

export type Mission = {
  id: string; // Firestore document ID
  title: string;
  description: string;
  assignedTo: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
};

export type Conflict = {
    id: string; // Firestore document ID
    village: string;
    description: string;
    reportedDate: string; // YYYY-MM-DD
    status: 'Ongoing' | 'Resolved' | 'Mediating';
}

    
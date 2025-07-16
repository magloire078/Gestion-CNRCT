
export type Employee = {
  id: string; // Firestore document ID
  matricule: string;
  name: string;
  email?: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  photoUrl: string;
};

export const employeeData: Employee[] = [
  { id: 'EMP001', matricule: 'A 0011', name: 'Alice Johnson', department: 'Engineering', role: 'Senior Developer', status: 'Active', photoUrl: 'https://placehold.co/100x100.png' },
  { id: 'EMP002', matricule: 'V 0019', name: 'Bob Smith', department: 'Marketing', role: 'Marketing Manager', status: 'Active', photoUrl: 'https://placehold.co/100x100.png' },
  { id: 'EMP003', matricule: 'F 001', name: 'Charlie Brown', department: 'HR', role: 'HR Specialist', status: 'On Leave', photoUrl: 'https://placehold.co/100x100.png' },
  { id: 'EMP004', matricule: 'A 0022', name: 'Diana Prince', department: 'Engineering', role: 'UI/UX Designer', status: 'Active', photoUrl: 'https://placehold.co/100x100.png' },
  { id: 'EMP005', matricule: 'A 0024', name: 'Ethan Hunt', department: 'Sales', role: 'Sales Executive', status: 'Terminated', photoUrl: 'https://placehold.co/100x100.png' },
  { id: 'EMP006', matricule: 'C 0013', name: 'Fiona Glenanne', department: 'Operations', role: 'Operations Manager', status: 'Active', photoUrl: 'https://placehold.co/100x100.png' },
];

export type Leave = {
  id: string;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Approved' | 'Pending' | 'Rejected';
};

export const leaveData: Leave[] = [
  { id: 'LVE001', employee: 'Charlie Brown', type: 'Annual Leave', startDate: '2024-07-20', endDate: '2024-07-25', status: 'Approved' },
  { id: 'LVE002', employee: 'Alice Johnson', type: 'Sick Leave', startDate: '2024-08-01', endDate: '2024-08-02', status: 'Pending' },
  { id: 'LVE003', employee: 'Bob Smith', type: 'Personal Leave', startDate: '2024-08-05', endDate: '2024-08-05', status: 'Pending' },
  { id: 'LVE004', employee: 'Diana Prince', type: 'Maternity Leave', startDate: '2024-09-01', endDate: '2025-03-01', status: 'Approved' },
  { id: 'LVE005', employee: 'Ethan Hunt', type: 'Sick Leave', startDate: '2024-06-15', endDate: '2024-06-15', status: 'Rejected' },
];

export type Asset = {
  tag: string;
  type: string;
  model: string;
  assignedTo: string;
  status: 'In Use' | 'In Stock' | 'In Repair' | 'Retired' | 'Active';
}

export const assetData: Asset[] = [
  { tag: 'IT-LPT-001', type: 'Laptop', model: 'Dell XPS 15', assignedTo: 'Alice Johnson', status: 'In Use' },
  { tag: 'IT-MON-005', type: 'Monitor', model: 'LG UltraFine 27"', assignedTo: 'Alice Johnson', status: 'In Use' },
  { tag: 'IT-LPT-002', type: 'Laptop', model: 'MacBook Pro 16"', assignedTo: 'Diana Prince', status: 'In Use' },
  { tag: 'IT-SFT-010', type: 'Software', model: 'Figma License', assignedTo: 'Diana Prince', status: 'Active' },
  { tag: 'IT-LPT-003', type: 'Laptop', model: 'ThinkPad X1 Carbon', assignedTo: 'Bob Smith', status: 'In Use' },
  { tag: 'IT-LPT-004', type: 'Laptop', model: 'Dell XPS 15', assignedTo: 'Unassigned', status: 'In Stock' },
];

export type Fleet = {
  plate: string;
  makeModel: string;
  assignedTo: string;
  maintenanceDue: string;
};

export const fleetData: Fleet[] = [
  { plate: 'XYZ 123', makeModel: 'Toyota Camry 2022', assignedTo: 'Bob Smith', maintenanceDue: '2024-12-15' },
  { plate: 'ABC 789', makeModel: 'Ford Transit 2021', assignedTo: 'Pool Vehicle', maintenanceDue: '2024-09-30' },
  { plate: 'GHI 456', makeModel: 'Honda Civic 2023', assignedTo: 'Ethan Hunt', maintenanceDue: '2025-02-10' },
  { plate: 'JKL 101', makeModel: 'Tesla Model 3', assignedTo: 'Management', maintenanceDue: '2025-05-20' },
];

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Employé';
}

export const userData: User[] = [
    { id: 'USR001', name: 'Admin User', email: 'admin@cnrct.com', role: 'Admin' },
    { id: 'USR002', name: 'Alice Johnson', email: 'alice.j@cnrct.com', role: 'Manager' },
    { id: 'USR003', name: 'Bob Smith', email: 'bob.s@cnrct.com', role: 'Employé' },
    { id: 'USR004', name: 'Charlie Brown', email: 'charlie.b@cnrct.com', role: 'Employé' },
]

export type Role = {
    id: string;
    name: 'Admin' | 'Manager' | 'Employé';
    permissions: string[];
}

export const roleData: Role[] = [
    { id: 'ROLE01', name: 'Admin', permissions: ['Tout gérer', 'Gérer les utilisateurs', 'Gérer les rôles', 'Gérer la paie'] },
    { id: 'ROLE02', name: 'Manager', permissions: ['Gérer les employés de l\'équipe', 'Approuver les congés', 'Voir les rapports'] },
    { id: 'ROLE03', name: 'Employé', permissions: ['Voir ses propres informations', 'Demander des congés'] },
]

export type Mission = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  startDate: string;
  endDate: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
};

export const missionData: Mission[] = [
    { id: 'MIS001', title: 'Audit des infrastructures régionales', description: 'Visiter 5 bureaux régionaux pour un audit complet.', assignedTo: 'Fiona Glenanne', startDate: '2024-09-01', endDate: '2024-09-30', status: 'Planned' },
    { id: 'MIS002', title: 'Déploiement du nouveau logiciel de paie', description: 'Installer et configurer le logiciel dans tous les départements.', assignedTo: 'Alice Johnson', startDate: '2024-08-15', endDate: '2024-10-15', status: 'In Progress' },
    { id: 'MIS003', title: 'Campagne marketing T4', description: 'Lancement de la nouvelle campagne publicitaire pour la fin de l\'année.', assignedTo: 'Bob Smith', startDate: '2024-10-01', endDate: '2024-12-31', status: 'Planned' },
];

export type Conflict = {
    id: string;
    village: string;
    description: string;
    reportedDate: string;
    status: 'Ongoing' | 'Resolved' | 'Mediating';
}

export const conflictData: Conflict[] = [
    { id: 'CNF001', village: 'Kpomassè', description: 'Dispute sur la délimitation des terres agricoles entre deux familles.', reportedDate: '2024-07-28', status: 'Mediating' },
    { id: 'CNF002', village: 'Ouidah', description: 'Conflit concernant l\'accès à un point d\'eau commun.', reportedDate: '2024-07-15', status: 'Resolved' },
    { id: 'CNF003', village: 'Allada', description: 'Désaccord sur la gestion des revenus du marché local.', reportedDate: '2024-08-01', status: 'Ongoing' },
];

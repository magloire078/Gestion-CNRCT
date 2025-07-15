export type Employee = {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
};

export const employeeData: Employee[] = [
  { id: 'EMP001', name: 'Alice Johnson', department: 'Engineering', role: 'Senior Developer', status: 'Active' },
  { id: 'EMP002', name: 'Bob Smith', department: 'Marketing', role: 'Marketing Manager', status: 'Active' },
  { id: 'EMP003', name: 'Charlie Brown', department: 'HR', role: 'HR Specialist', status: 'On Leave' },
  { id: 'EMP004', name: 'Diana Prince', department: 'Engineering', role: 'UI/UX Designer', status: 'Active' },
  { id: 'EMP005', name: 'Ethan Hunt', department: 'Sales', role: 'Sales Executive', status: 'Terminated' },
  { id: 'EMP006', name: 'Fiona Glenanne', department: 'Operations', role: 'Operations Manager', status: 'Active' },
];

export const leaveData = [
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

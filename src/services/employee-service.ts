
import type { Employee } from '@/lib/data';
import { employeeData } from '@/lib/data';


export async function getEmployees(): Promise<Employee[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(employeeData);
}

export async function addEmployee(employeeDataToAdd: Omit<Employee, 'id'>): Promise<Employee> {
    const newEmployee: Employee = { 
        id: `EMP${Math.floor(Math.random() * 1000)}`, 
        ...employeeDataToAdd
    };
    employeeData.push(newEmployee);
    return Promise.resolve(newEmployee);
}

export async function updateEmployee(employeeId: string, employeeDataToUpdate: Omit<Employee, 'id'>): Promise<Employee> {
    const employeeIndex = employeeData.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
        throw new Error("Employee not found");
    }
    const updatedEmployee = { id: employeeId, ...employeeDataToUpdate };
    employeeData[employeeIndex] = updatedEmployee;
    return Promise.resolve(updatedEmployee);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
    const index = employeeData.findIndex(emp => emp.id === employeeId);
    if (index > -1) {
        employeeData.splice(index, 1);
    }
    return Promise.resolve();
}

export async function batchAddEmployees(employees: Omit<Employee, 'id'>[]) {
    // This function is for seeding, which is not needed with mock data.
    console.log("Batch add is disabled when using mock data.");
    return Promise.resolve();
}


import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// --- Mock Data ---
const mockFleet: Fleet[] = [
  { plate: 'AB-123-CI', makeModel: 'Toyota Hilux', assignedTo: 'Équipe Terrain', maintenanceDue: '2024-09-15' },
  { plate: 'CD-456-CI', makeModel: 'Hyundai Grand i10', assignedTo: 'Service Courrier', maintenanceDue: '2024-08-30' },
  { plate: 'EF-789-CI', makeModel: 'Toyota Prado', assignedTo: 'Direction', maintenanceDue: '2025-01-20' },
  { plate: 'GH-012-CI', makeModel: 'Renault Duster', assignedTo: 'Amoin Thérèse', maintenanceDue: '2024-11-10' },
];
// --- End Mock Data ---


export function subscribeToVehicles(
    callback: (vehicles: Fleet[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockFleet), 5000);
    return () => clearInterval(interval);
}

export async function getVehicles(): Promise<Fleet[]> {
  return Promise.resolve(mockFleet);
}

export async function addVehicle(vehicleDataToAdd: Omit<Fleet, 'id'> & { plate: string }): Promise<Fleet> {
    const newVehicle: Fleet = { ...vehicleDataToAdd };
    mockFleet.push(newVehicle);
    return Promise.resolve(newVehicle);
}

export async function searchVehicles(query: string): Promise<Fleet[]> {
    const lowerCaseQuery = query.toLowerCase();
    const allVehicles = await getVehicles();
    return allVehicles.filter(vehicle => 
        vehicle.plate.toLowerCase().includes(lowerCaseQuery) || 
        vehicle.makeModel.toLowerCase().includes(lowerCaseQuery) ||
        vehicle.assignedTo.toLowerCase().includes(lowerCaseQuery)
    );
}

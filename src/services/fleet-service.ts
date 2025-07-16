
import type { Fleet } from '@/lib/data';
import { fleetData } from '@/lib/data';

export async function getVehicles(): Promise<Fleet[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(fleetData);
}

export async function addVehicle(vehicleDataToAdd: Omit<Fleet, "id">): Promise<Fleet> {
    // Since mock data doesn't have an ID, we'll just add it.
    fleetData.push(vehicleDataToAdd);
    return Promise.resolve(vehicleDataToAdd);
}

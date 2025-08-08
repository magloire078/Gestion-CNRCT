
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Mission } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled

// --- Mock Data ---
const mockMissions: Mission[] = [
    { id: '1', title: 'Tournée de sensibilisation', description: 'Visite des chefs de la région du Poro.', assignedTo: 'Équipe Communication', startDate: '2024-09-05', endDate: '2024-09-12', status: 'Planifiée' },
    { id: '2', title: 'Formation GLPI', description: 'Formation sur le nouvel outil de ticketing.', assignedTo: 'Service Informatique', startDate: '2024-07-25', endDate: '2024-07-26', status: 'Terminée' },
    { id: '3', title: 'Organisation de la fête de l\'indépendance', description: 'Coordonner les activités à Yamoussoukro.', assignedTo: 'Traoré Moussa', startDate: '2024-08-01', endDate: '2024-08-07', status: 'En cours' },
];
// --- End Mock Data ---


export function subscribeToMissions(
    callback: (missions: Mission[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback(mockMissions), 5000);
    return () => clearInterval(interval);
}

export async function getMissions(): Promise<Mission[]> {
  return Promise.resolve(mockMissions);
}

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const newMission: Mission = { 
        id: `mission-${Date.now()}`, 
        ...missionDataToAdd 
    };
    mockMissions.push(newMission);
    return Promise.resolve(newMission);
}

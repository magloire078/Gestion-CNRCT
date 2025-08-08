
import { collection, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initializeDefaultRoles } from '../services/role-service';

// Mock data (replace with your actual data structure and content)
const employeesData = [
    { id: '1', matricule: 'M001', name: 'Koffi Jean-Luc', firstName: 'Jean-Luc', lastName: 'Koffi', poste: 'Développeur Senior', department: 'Informatique', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'koffi.jl@example.com', dateEmbauche: '2020-01-15', baseSalary: 1200000, CNPS: true, sexe: 'Homme' },
    { id: '2', matricule: 'M002', name: 'Amoin Thérèse', firstName: 'Thérèse', lastName: 'Amoin', poste: 'Chef de projet', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'amoin.t@example.com', dateEmbauche: '2018-05-20', baseSalary: 1800000, CNPS: true, sexe: 'Femme' },
    { id: '3', matricule: 'M003', name: 'N\'Guessan Paul', firstName: 'Paul', lastName: 'N\'Guessan', poste: 'Comptable', department: 'Direction des Affaires financières et du patrimoine', status: 'En congé', photoUrl: 'https://placehold.co/100x100.png', email: 'nguessan.p@example.com', dateEmbauche: '2022-11-01', baseSalary: 800000, CNPS: false, sexe: 'Homme' },
    { id: '4', matricule: 'M004', name: 'Brou Adjoua', firstName: 'Adjoua', lastName: 'Brou', poste: 'Assistante de direction', department: 'Secretariat Général', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'brou.a@example.com', dateEmbauche: '2021-02-10', baseSalary: 750000, CNPS: true, sexe: 'Femme' },
    { id: '5', matricule: 'M005', name: 'Traoré Moussa', firstName: 'Moussa', lastName: 'Traoré', poste: 'Chargé de communication', department: 'Communication', status: 'Retraité', photoUrl: 'https://placehold.co/100x100.png', email: 'traore.m@example.com', dateEmbauche: '2015-08-30', baseSalary: 950000, CNPS: true, sexe: 'Homme', Date_Depart: '2024-06-30' },
];

const chiefsData = [
    { id: '1', name: 'Nanan Kouakou Anougblé III', title: 'Roi des Baoulé', role: 'Roi', region: 'Gbêkê', department: 'Sakassou', subPrefecture: 'Sakassou', village: 'Sakassou', contact: '+225 0102030405', bio: 'Roi du royaume Baoulé depuis 1993.', photoUrl: 'https://placehold.co/100x100.png', latitude: 7.6833, longitude: -5.2833 },
    { id: '2', name: 'Sa Majesté Amon N\'Douffou V', title: 'Roi du Sanwi', role: 'Roi', region: 'Sud-Comoé', department: 'Aboisso', subPrefecture: 'Aboisso', village: 'Krindjabo', contact: '+225 0203040506', bio: 'Gardien des traditions Agni.', photoUrl: 'https://placehold.co/100x100.png', latitude: 5.485, longitude: -3.208 },
];

async function seedCollection(collectionName: string, data: any[]) {
    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);
    
    console.log(`Seeding ${collectionName}...`);
    data.forEach(item => {
        const docRef = collectionRef.doc(item.id || undefined);
        batch.set(docRef, item);
    });
    
    await batch.commit();
    console.log(`${collectionName} seeded successfully with ${data.length} documents.`);
}

async function main() {
    try {
        console.log("Starting database seeding...");
        
        await initializeDefaultRoles();
        await seedCollection('employees', employeesData);
        await seedCollection('chiefs', chiefsData);

        // Add other collections to seed here...
        // e.g., await seedCollection('leaves', leavesData);
        
        console.log("Database seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

main();

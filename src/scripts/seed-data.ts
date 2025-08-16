
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initializeDefaultRoles } from '../services/role-service';
import type { Employe } from '@/lib/data';

// Mock data (replace with your actual data structure and content)
const employeesData: Employe[] = [
    { id: '1', matricule: 'M001', name: 'Koffi Jean-Luc', firstName: 'Jean-Luc', lastName: 'Koffi', poste: 'Développeur Senior', department: 'Informatique', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'koffi.jl@example.com', dateEmbauche: '2020-01-15', baseSalary: 1200000, CNPS: true, sexe: 'Homme' },
    { id: '2', matricule: 'M002', name: 'Amoin Thérèse', firstName: 'Thérèse', lastName: 'Amoin', poste: 'Chef de projet', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'amoin.t@example.com', dateEmbauche: '2018-05-20', baseSalary: 1800000, CNPS: true, sexe: 'Femme' },
    { id: '3', matricule: 'M003', name: 'N\'Guessan Paul', firstName: 'Paul', lastName: 'N\'Guessan', poste: 'Comptable', department: 'Direction des Affaires financières et du patrimoine', status: 'En congé', photoUrl: 'https://placehold.co/100x100.png', email: 'nguessan.p@example.com', dateEmbauche: '2022-11-01', baseSalary: 800000, CNPS: false, sexe: 'Homme' },
    { id: '4', matricule: 'M004', name: 'Brou Adjoua', firstName: 'Adjoua', lastName: 'Brou', poste: 'Assistante de direction', department: 'Secretariat Général', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'brou.a@example.com', dateEmbauche: '2021-02-10', baseSalary: 750000, CNPS: true, sexe: 'Femme' },
    { id: '5', matricule: 'M005', name: 'Traoré Moussa', firstName: 'Moussa', lastName: 'Traoré', poste: 'Chargé de communication', department: 'Communication', status: 'Retraité', photoUrl: 'https://placehold.co/100x100.png', email: 'traore.m@example.com', dateEmbauche: '2015-08-30', baseSalary: 950000, CNPS: true, sexe: 'Homme', Date_Depart: '2024-06-30' },
    { id: 'rOp5WehK31fRuhZxeMc3', matricule: 'D 040', firstName: 'Ake Placide Guy Marie', lastName: 'ABODI', name: 'Ake Placide Guy Marie ABODI', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'rPjyFBf8PHCvKbHZJrzN', matricule: 'D 025', firstName: 'Ameyao Felix', lastName: 'ADOM', name: 'Ameyao Felix ADOM', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'WUeNujwCJWzrE3vxO2Ah', matricule: 'D 048', firstName: 'Yao Lambert', lastName: 'ASSI', name: 'Yao Lambert ASSI', email: '', poste: '3eme vice-president', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'b3MujEyJHoaoLablzyks', matricule: 'D 006', firstName: 'Yapi Julien', lastName: 'BOKA', name: 'Yapi Julien BOKA', email: '', poste: '5eme vice-president', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'TpTsafFbA4XRXoFVhrKj', matricule: 'D 046', firstName: 'Ake Augustin', lastName: 'BOLLO', name: 'Ake Augustin BOLLO', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'wnTCKwvkLDrdPFzpb2vq', matricule: 'D 017', firstName: 'Victor Emmanuel', lastName: 'COULAYES', name: 'Victor Emmanuel COULAYES', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Décédé', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '2ubrojHJcvwsg7opcG1h', matricule: 'D 002A', firstName: 'Bafao', lastName: 'COULIBALY', name: 'Bafao COULIBALY', email: '', poste: '1er vice-president', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '2M2ZhXW4r4amzlTNnNwU', matricule: 'D 002', firstName: 'Issa', lastName: 'COULIBALY', name: 'Issa COULIBALY', email: '', poste: '1er vice-president', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'zyNuwPn4p6hyTkszNN2E', matricule: 'D 021', firstName: 'René', lastName: 'DIBI', name: 'René DIBI', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'EdgczptzPB0zwcKiTcGl', matricule: 'D 014', firstName: 'Gouamou', lastName: 'DIOMANDE', name: 'Gouamou DIOMANDE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'AHSMVSRCnbTGvSjDYVmO', matricule: 'D 035', firstName: 'Ibrahima', lastName: 'DIOMANDE', name: 'Ibrahima DIOMANDE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'vqThpTgLdNFvK3qtZUm2', matricule: 'D 037', firstName: 'Nama', lastName: 'DIOMANDE', name: 'Nama DIOMANDE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'c7Qryk324nfwZu6BxoKZ', matricule: 'D 004', firstName: 'N\'dépo', lastName: 'DODO', name: 'N\'dépo DODO', email: '', poste: '3eme vice-president', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'QZJ7DbR6mlyRbvj0rD67', matricule: 'D 007', firstName: 'Lemissa', lastName: 'DOSSO', name: 'Lemissa DOSSO', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'KI9A0LyID6f7G0REk188', matricule: 'D 039', firstName: 'Mamadou', lastName: 'DOSSO', name: 'Mamadou DOSSO', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'D6YcYLy6CYbOEECL0Vum', matricule: 'D 029', firstName: 'Tehoa', lastName: 'EHORA', name: 'Tehoa EHORA', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'QtH0TMzTtkauM6htrkYO', matricule: 'D 003', firstName: 'Lambert', lastName: 'GBIZIE', name: 'Lambert GBIZIE', email: '', poste: '2eme vice-president', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'eIlqe4Ta1TW7lPSAxOy7', matricule: 'D 008', firstName: 'Pascal', lastName: 'GUE', name: 'Pascal GUE', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'UiinG5I5Y6YfKYtl9bbD', matricule: 'D 022', firstName: 'VLEHI Vincent', lastName: 'GUEHI', name: 'VLEHI Vincent GUEHI', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'YKxw0Ejs0I9yD5nOpO1u', matricule: 'D 042', firstName: 'Alain Jerome', lastName: 'GUIGY', name: 'Alain Jerome GUIGY', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'Tau0AFYuhBkPhvSs1UAe', matricule: 'D 024', firstName: 'Kalet André', lastName: 'HOBOU', name: 'Kalet André HOBOU', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'F9NewNRj8eQ4FPe5TZzK', matricule: 'D 033', firstName: 'Ouattara', lastName: 'KOBANAN', name: 'Ouattara KOBANAN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'ZnfMenktdp7R5R2SLh38', matricule: 'D 032', firstName: 'Gnepa', lastName: 'KOEYE', name: 'Gnepa KOEYE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'WhrRrzgwiPJyPy0oFUKp', matricule: 'D 023', firstName: 'Touré Innocent', lastName: 'KOLO', name: 'Touré Innocent KOLO', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'bo2GuzH6HGun7td2Gc87', matricule: 'D 041', firstName: 'Nanourou', lastName: 'KONE', name: 'Nanourou KONE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'Mn0rq5svinxQ1khWDf1i', matricule: 'D 015', firstName: 'Tenan', lastName: 'KONE', name: 'Tenan KONE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'vBPhccKWSga0W4q3YvH5', matricule: 'D 049', firstName: 'Johanny Maxime', lastName: 'KOUADIO', name: 'Johanny Maxime KOUADIO', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'xvGsHdKkrrJi9jFlM7Cl', matricule: 'D 010', firstName: 'Adingra', lastName: 'KOUASSI', name: 'Adingra KOUASSI', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'TQ3CalNweYZOPnmWaBDp', matricule: 'D 018', firstName: 'Sangaré', lastName: 'MALALY', name: 'Sangaré MALALY', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'oYy6d21JNtPRVdmUljW7', matricule: 'D 034', firstName: 'Agnini Bile Jean Marie', lastName: 'MALAN', name: 'Agnini Bile Jean Marie MALAN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'aeUBQBtquqZM0fw4LtCj', matricule: 'D 013', firstName: 'Ando Joseph', lastName: 'N\'DORI', name: 'Ando Joseph N\'DORI', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'TubVPATKxfmNfIdrZYkN', matricule: 'D 028', firstName: 'Kouassi', lastName: 'N\'DRI', name: 'Kouassi N\'DRI', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '3g0Qghox2yDG3rfHgxnH', matricule: 'D 009', firstName: 'Simon', lastName: 'N\'GBOBA', name: 'Simon N\'GBOBA', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'SFznewJQ8P86jX28X7i6', matricule: 'D 019', firstName: 'Koffi N\'guessan Jean', lastName: 'N\'GORAN', name: 'Koffi N\'guessan Jean N\'GORAN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'QaIwrstdDEv0gos8sOhj', matricule: 'D 016', firstName: 'Bangui', lastName: 'N\'GUESSAN', name: 'Bangui N\'GUESSAN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'ts1rlchddVLbKLdlwBV0', matricule: 'D 031', firstName: 'Begbin', lastName: 'NGUESSAN', name: 'Begbin NGUESSAN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'Oq5Lmgo6fJk9y9ZizIRU', matricule: 'D 036', firstName: 'Guibonkoro', lastName: 'OUATTARA', name: 'Guibonkoro OUATTARA', email: '', poste: '4eme vice-president', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'Yl6Ikn72s6c4uReqJNKH', matricule: 'D 005', firstName: 'Inisié', lastName: 'OUATTARA', name: 'Inisié OUATTARA', email: '', poste: '4eme vice-president', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'FM2oV27ohJGkgoHMPmPl', matricule: 'D 047', firstName: 'Bi Gore Lucien', lastName: 'OUIN', name: 'Bi Gore Lucien OUIN', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '72JaIYtE9IcNDLA8R99l', matricule: 'D 044', firstName: 'Pierre', lastName: 'SEREL', name: 'Pierre SEREL', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '8pXf50FBKZQTbhKxeIK6', matricule: 'D 001', firstName: 'Amon Paul Désiré', lastName: 'TANOE', name: 'Amon Paul Désiré TANOE', email: '', poste: 'President du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'ywgFemUJMonMNv7XHhs4', matricule: 'D 011', firstName: 'Monique Epse Koffi', lastName: 'TANOU', name: 'Monique Epse Koffi TANOU', email: '', poste: 'Membre du bureau', department: 'Directoire', status: 'Décédé', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'xmfq8lSgYrGEv5PFU3m8', matricule: 'D 027', firstName: 'Aliko', lastName: 'TEGBO', name: 'Aliko TEGBO', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'jqaHfkXJrlkQwpSh1vX9', matricule: 'D 012', firstName: 'Augustin Houphouët Abdoulaye', lastName: 'THIAM', name: 'Augustin Houphouët Abdoulaye THIAM', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '0wsuirSckVG1iHazcgDU', matricule: 'D 038', firstName: 'Allou Malan Clode', lastName: 'TIGORI', name: 'Allou Malan Clode TIGORI', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'MaQXqKncaNiXiykHKgdo', matricule: 'D 043', firstName: 'Papa', lastName: 'TOUKROU', name: 'Papa TOUKROU', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'XhmfGtfJVsbXndQhc7V7', matricule: 'D 045', firstName: 'Bakary', lastName: 'TOURE', name: 'Bakary TOURE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'aCH9B3kUUPHiZWwpdhmd', matricule: 'D 026', firstName: 'Lanciné', lastName: 'TOURE', name: 'Lanciné TOURE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Licencié', photoUrl: 'https://placehold.co/100x100.png' },
    { id: '55YcFIEaGkDoeuxXq4QZ', matricule: 'D 020', firstName: 'Dougbo Joseph', lastName: 'WANDA', name: 'Dougbo Joseph WANDA', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Décédé', photoUrl: 'https://placehold.co/100x100.png' },
    { id: 'mxBXF63yg91kaqr2UMPd', matricule: 'D 030', firstName: 'Digbeu', lastName: 'ZOBRE', name: 'Digbeu ZOBRE', email: '', poste: 'Membre du Directoire', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png' },
];

const chiefsData = [
    { id: '1', name: 'Nanan Kouakou Anougblé III', title: 'Roi des Baoulé', role: 'Roi', region: 'Gbêkê', department: 'Sakassou', subPrefecture: 'Sakassou', village: 'Sakassou', contact: '+225 0102030405', bio: 'Roi du royaume Baoulé depuis 1993.', photoUrl: 'https://placehold.co/100x100.png', latitude: 7.6833, longitude: -5.2833 },
    { id: '2', name: 'Sa Majesté Amon N\'Douffou V', title: 'Roi du Sanwi', role: 'Roi', region: 'Sud-Comoé', department: 'Aboisso', subPrefecture: 'Aboisso', village: 'Krindjabo', contact: '+225 0203040506', bio: 'Gardien des traditions Agni.', photoUrl: 'https://placehold.co/100x100.png', latitude: 5.485, longitude: -3.208 },
];

// Automatically add employees from 'Directoire' or with 'Region' to the chiefs data
const employeesToSyncAsChiefs = employeesData
    .filter(emp => emp.department === 'Directoire' || (emp.Region && emp.Village))
    .map(emp => ({
        id: emp.id, // Use same ID for simplicity in seeding
        name: emp.name,
        firstName: emp.firstName,
        lastName: emp.lastName,
        title: emp.poste,
        role: 'Chef de Canton',
        sexe: emp.sexe,
        region: emp.Region || '',
        department: emp.Departement || '',
        village: emp.Village || '',
        photoUrl: emp.photoUrl || 'https://placehold.co/100x100.png',
    }));

const combinedChiefsData = [
    ...chiefsData,
    ...employeesToSyncAsChiefs,
];

// Remove duplicates by name
const uniqueChiefsData = Array.from(new Map(combinedChiefsData.map(item => [item.name, item])).values());


async function seedCollection(collectionName: string, data: any[]) {
    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);
    
    console.log(`Seeding ${collectionName}...`);
    data.forEach(item => {
        const docRef = doc(collectionRef, item.id || undefined); // Use provided ID or generate a new one
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
        await seedCollection('chiefs', uniqueChiefsData);

        // Add other collections to seed here...
        // e.g., await seedCollection('leaves', leavesData);
        
        console.log("Database seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

main();


// This is a one-time script to migrate data from the SQL dump to Firestore.
// To run this script, you'll need to:
// 1. Ensure your .env.local file has your Firebase project credentials.
// 2. Install ts-node: `npm install -g ts-node`
// 3. Run the script from your project root: `ts-node src/scripts/migrate-data.ts`
//
// IMPORTANT: Only run this script ONCE to avoid creating duplicate data.

import { config } from 'dotenv';
config({ path: '.env' }); // Adjust path if your env file is elsewhere

import { batchAddEmployees } from '../services/employee-service';
import type { Employee } from '../lib/data';

const sqlData = [
    { id_emp: 1, civilite: 'Monsieur', nom_emp: "N'GUESSAN", prenom_emp: 'Armand Emmanuel', mat_emp: 'A 0011', sexe: 'M', poste_emp: 'Technicien en informatique', service_emp: 'Informatique', Email: '', Photo: 'A 00 11.jp', bActif: 1 },
    { id_emp: 2, civilite: 'Monsieur', nom_emp: 'GUIN', prenom_emp: 'Guelayhi Charles Joselin', mat_emp: 'V 0019', sexe: 'M', poste_emp: 'Chauffeur SG', service_emp: 'Secretariat Général', Email: '', Photo: 'V 0019.jpg', bActif: 1 },
    { id_emp: 3, civilite: 'Monsieur', nom_emp: 'MAMADOU', prenom_emp: 'Kamara', mat_emp: 'F 001', sexe: 'M', poste_emp: 'Secrétaire Général (SG)', service_emp: 'Secrétariat Général', Email: '', Photo: 'F 001.png', bActif: 0 },
    { id_emp: 4, civilite: 'Monsieur', nom_emp: 'ETTIEN', prenom_emp: 'Kouamé Éric', mat_emp: 'A 0022', sexe: 'M', poste_emp: 'Cameramen-monteur', service_emp: 'Communication', Email: '', Photo: '.jpg', bActif: 1 },
    { id_emp: 5, civilite: 'Madame', nom_emp: 'GOUEU', prenom_emp: 'Linda Sandrine Espe SEHI', mat_emp: 'A 0024', sexe: 'F', poste_emp: 'Chargée du Personnel', service_emp: 'Direction Administrative', Email: '', Photo: 'A 0024.jpg', bActif: 1 },
    { id_emp: 6, civilite: 'Monsieur', nom_emp: 'DEDE', prenom_emp: 'Sobo Michel Ennik', mat_emp: 'C 0013', sexe: 'M', poste_emp: 'Chef cellule informatique', service_emp: 'Informatique', Email: '', Photo: '.jpg', bActif: 1 },
    { id_emp: 7, civilite: 'Monsieur', nom_emp: 'COULIBALY', prenom_emp: 'Fondio Siaka', mat_emp: 'C 0014', sexe: 'M', poste_emp: 'SD chargé du Protocole', service_emp: 'Protocole', Email: '', Photo: '.jpg', bActif: 1 },
    { id_emp: 8, civilite: 'Monsieur', nom_emp: 'KOUASSI', prenom_emp: 'Amani', mat_emp: 'C 0015', sexe: 'M', poste_emp: 'Sous-Directeur chargé des finances et du budget', service_emp: 'Direction des Affaires financières et du patrimoine', Email: 'lehimienssah@gmail.com', Photo: '.jpg', bActif: 1 },
    { id_emp: 9, civilite: 'Monsieur', nom_emp: "M'BALA", prenom_emp: 'Gnoan Roger', mat_emp: 'C 0017', sexe: 'M', poste_emp: 'Conseiller Spécial du Président', service_emp: 'Cabinet', Email: '', Photo: 'C 0017.jpg', bActif: 0 },
    { id_emp: 10, civilite: 'Monsieur', nom_emp: 'FONDIO', prenom_emp: 'Samba', mat_emp: 'C 0215', sexe: 'M', poste_emp: 'Conseiller Spécial Chargé des affaires juridiques auprès du Président', service_emp: 'Cabinet', Email: '', Photo: 'C 0215.jpg', bActif: 1 },
    { id_emp: 21, civilite: 'Madame', nom_emp: 'BOGNINI', prenom_emp: 'Yabah Berthe épse Karbo', mat_emp: 'C 0110', sexe: 'M', poste_emp: 'Directeur de Cabinet', service_emp: 'Cabinet', Email: '', Photo: 'C 0110.jpg', bActif: 1 },
    { id_emp: 391, civilite: 'Monsieur', nom_emp: 'SIKA', prenom_emp: 'Aboa Etienne Pépin', mat_emp: 'C 0022', sexe: 'M', poste_emp: 'Assistant chef du service Communication/Relation Presse', service_emp: 'Communication', Email: '', Photo: 'C 0022.jpg', bActif: 1 },
];

function transformSqlToEmployee(record: any): Omit<Employee, 'id'> {
    return {
        matricule: record.mat_emp,
        name: `${record.prenom_emp} ${record.nom_emp}`,
        email: record.Email || undefined,
        role: record.poste_emp,
        department: record.service_emp,
        status: record.bActif === 1 ? 'Active' : 'Terminated',
        photoUrl: `https://placehold.co/100x100.png` // Placeholder, as paths are local
    };
}

async function main() {
    console.log("Starting data migration...");

    try {
        const employeesToUpload = sqlData.map(transformSqlToEmployee);
        await batchAddEmployees(employeesToUpload);
        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Error during migration:", error);
    }
    // The script does not exit automatically. You must manually stop it (Ctrl+C).
}

main();

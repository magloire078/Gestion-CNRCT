import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, isConfigValid } from '../lib/firebase';
import type { Employe } from '@/lib/data';
import { parseISO, addYears, format, isValid, getYear } from 'date-fns';

const employeesCollectionRef = collection(db, 'employees');

async function correctDepartureDates() {
    console.log("DEBUG: PROJECT_ID =", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log("Configuration Firebase valide :", isConfigValid);
    if (!isConfigValid) {
        console.error("ERREUR : La configuration Firebase est manquante ou invalide.");
        return;
    }

    console.log("Démarrage du script de correction des dates de départ...");
    const snapshot = await getDocs(employeesCollectionRef);
    console.log(`Nombre d'employés trouvés dans Firestore : ${snapshot.size}`);
    const allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employe));

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const employee of allEmployees) {
        let needsUpdate = false;
        let newDepartureDate: string | undefined = undefined;

        if (!employee.Date_Depart || !employee.Date_Naissance || !isValid(parseISO(employee.Date_Naissance))) {
            continue;
        }

        try {
            const departureDate = parseISO(employee.Date_Depart);
            const birthDate = parseISO(employee.Date_Naissance);
            const retirementDate = addYears(birthDate, 60);

            // Condition 1: Date de départ est 01/01/2017
            if (employee.Date_Depart === '2017-01-01' || format(departureDate, 'yyyy-MM-dd') === '2017-01-01') {
                needsUpdate = true;
                newDepartureDate = format(retirementDate, 'yyyy-MM-dd');
            }

            // Condition 2: Employé actif mais date de départ en 2020
            if (employee.status === 'Actif' && getYear(departureDate) === 2020) {
                needsUpdate = true;
                newDepartureDate = format(retirementDate, 'yyyy-MM-dd');
            }

            if (needsUpdate && newDepartureDate) {
                console.log(`Correction pour ${employee.name} (ID: ${employee.id}):`);
                console.log(`  - Ancienne date: ${employee.Date_Depart}`);
                console.log(`  - Nouvelle date: ${newDepartureDate}`);
                const employeeDocRef = doc(db, 'employees', employee.id);
                batch.update(employeeDocRef, { Date_Depart: newDepartureDate });
                updatedCount++;
            }

        } catch (e) {
            console.error(`Erreur lors du traitement de l'employé ${employee.name} (ID: ${employee.id}). Date de départ: ${employee.Date_Depart}. Erreur:`, e);
        }
    }

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`\nOpération terminée. ${updatedCount} employé(s) ont été mis à jour.`);
    } else {
        console.log("\nOpération terminée. Aucune date de départ à corriger n'a été trouvée.");
    }
}

async function main() {
    try {
        await correctDepartureDates();
        process.exit(0);
    } catch (error) {
        console.error("Le script de correction a échoué :", error);
        process.exit(1);
    }
}

main();

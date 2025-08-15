
import { collection, getDocs, setDoc, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Employe, Chief } from '../lib/data';

async function syncChiefs() {
    console.log("Starting synchronization of employees to chiefs...");

    const employeesCollection = collection(db, 'employees');
    const chiefsCollection = collection(db, 'chiefs');
    
    const employeesSnapshot = await getDocs(employeesCollection);
    const allEmployees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employe));

    const potentialChiefs = allEmployees.filter(emp => emp.department === 'Directoire' || (emp.Region && emp.Village));
    console.log(`Found ${potentialChiefs.length} potential chiefs from the employee list.`);

    if (potentialChiefs.length === 0) {
        console.log("No employees to sync. Exiting.");
        return;
    }

    const chiefNames = potentialChiefs.map(p => p.name);
    const existingChiefsMap = new Map<string, {id: string, data: Chief}>();

    for (let i = 0; i < chiefNames.length; i += 30) {
        const chunk = chiefNames.slice(i, i + 30);
        if(chunk.length > 0) {
            const chiefsQuery = query(chiefsCollection, where('name', 'in', chunk));
            const existingSnapshot = await getDocs(chiefsQuery);
            existingSnapshot.docs.forEach(docSnap => {
                const chiefData = docSnap.data() as Chief;
                existingChiefsMap.set(chiefData.name, { id: docSnap.id, data: chiefData });
            });
        }
    }
    console.log(`Found ${existingChiefsMap.size} existing chiefs to potentially update.`);

    const batch = writeBatch(db);
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const employee of potentialChiefs) {
        const chiefData: Partial<Chief> = {
            name: employee.name,
            firstName: employee.firstName,
            lastName: employee.lastName,
            title: employee.poste || 'Titre non défini',
            role: 'Chef de Canton',
            sexe: employee.sexe,
            region: employee.Region || '',
            department: employee.Departement || '',
            village: employee.Village || '',
            photoUrl: employee.photoUrl || 'https://placehold.co/100x100.png',
        };

        const existingChief = existingChiefsMap.get(employee.name);
        
        if (existingChief) {
            const chiefDocRef = doc(db, 'chiefs', existingChief.id);
            batch.update(chiefDocRef, chiefData);
            updatedCount++;
        } else {
            const newChiefRef = doc(chiefsCollection);
            batch.set(newChiefRef, chiefData);
            createdCount++;
        }
    }

    await batch.commit();
    console.log("Synchronization complete.");
    console.log(`- ${createdCount} new chief(s) created.`);
    console.log(`- ${updatedCount} existing chief(s) updated.`);
}

main().catch(console.error);

async function main() {
    await syncChiefs();
}

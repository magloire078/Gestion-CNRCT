import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} else {
    console.error("serviceAccountKey.json not found!");
    process.exit(1);
}

const db = admin.firestore();

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

async function syncData() {
    try {
        // 1. Read TSV
        const tsvPath = path.join(process.cwd(), 'data', 'comites_regionaux_2026.tsv');
        const tsvData = fs.readFileSync(tsvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
        tsvData.shift(); // Skip header
        
        const targetChiefs = tsvData.map(line => {
            const parts = line.split('\t');
            if (parts.length < 7) return null;
            return {
                region: parts[1].trim(),
                department: parts[2].trim(),
                lastName: parts[3].trim(),
                firstName: parts[4].trim(),
                fullName: `${parts[3].trim()} ${parts[4].trim()}`.trim(),
                village: parts[5].trim().replace(/Chef du village de |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village/gi, '').trim(),
                contact: parts[6].trim()
            };
        }).filter(Boolean) as Array<any>;

        // 2. Fetch chiefs and employees
        const chiefsSnap = await db.collection('chiefs').get();
        const allChiefs = chiefsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        const empSnap = await db.collection('employees').get();
        const allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const activeEmpMembers = allEmployees.filter(e => e.poste === 'Membre Comité Régional' || (e.poste && e.poste.includes('Comité Régional')));

        let updatedChiefs = 0;
        let createdEmps = 0;
        let updatedEmps = 0;
        let archivedEmps = 0;

        const matchedEmpIds = new Set<string>();

        // 3. Process targets
        for (const target of targetChiefs) {
            const targetNormName = normalizeName(target.fullName);
            const targetNormLastFirst = normalizeName(`${target.lastName} ${target.firstName}`);

            // A. Update the Chief record
            const matchedChief = allChiefs.find(c => 
                (c.department || '').toLowerCase() === target.department.toLowerCase() &&
                (normalizeName(c.name || '') === targetNormName || normalizeName(`${c.lastName || ''} ${c.firstName || ''}`) === targetNormLastFirst)
            );

            let chiefIdForEmp = null;

            if (matchedChief) {
                chiefIdForEmp = matchedChief.id;
                await db.collection('chiefs').doc(matchedChief.id).update({
                    region: target.region,
                    department: target.department,
                    village: target.village,
                    contact: target.contact
                });
                updatedChiefs++;
            }

            // B. Update or Create Employee record
            const matchedEmp = activeEmpMembers.find(e => 
                (e.Departement || '').toLowerCase() === target.department.toLowerCase() &&
                (normalizeName(e.name || '') === targetNormName || normalizeName(`${e.lastName || ''} ${e.firstName || ''}`) === targetNormLastFirst)
            );

            if (matchedEmp) {
                matchedEmpIds.add(matchedEmp.id);
                await db.collection('employees').doc(matchedEmp.id).update({
                    Region: target.region,
                    Departement: target.department,
                    Village: target.village,
                    mobile: target.contact,
                    chiefId: chiefIdForEmp,
                    estRenouvele: true,
                    mandatDebut: '2026-06-01',
                    mandatFin: admin.firestore.FieldValue.delete()
                });
                updatedEmps++;
            } else {
                // Determine if this person exists as an employee under another role, if so just update them?
                // Let's create a new one to be safe and clean.
                await db.collection('employees').add({
                    matricule: `CR-${Date.now().toString().slice(-6)}`,
                    name: target.fullName,
                    lastName: target.lastName,
                    firstName: target.firstName,
                    poste: 'Membre Comité Régional',
                    Region: target.region,
                    Departement: target.department,
                    Village: target.village,
                    mobile: target.contact,
                    chiefId: chiefIdForEmp,
                    estRenouvele: false,
                    mandatDebut: '2026-06-01',
                    status: 'Actif',
                    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(target.fullName)}&background=006039&color=fff&size=100`,
                });
                createdEmps++;
            }
        }

        // 4. Archive old employees
        for (const emp of activeEmpMembers) {
            if (!matchedEmpIds.has(emp.id)) {
                await db.collection('employees').doc(emp.id).update({
                    estRenouvele: false,
                    mandatFin: '2026-05-31',
                    // The user wants them marked correctly. We can keep their status as 'Actif' since they are still in the system, 
                    // or 'Retraité' if they are no longer part of any CNRCT instance.
                    // For now, we apply exactly what the user approved: `mandatFin` and `estRenouvele: false`.
                });
                archivedEmps++;
            }
        }

        console.log(`\n=== BILAN SYNCHRONISATION ===`);
        console.log(`Informations complétées pour ${updatedChiefs} Chefs.`);
        console.log(`Employés (Comité Régional) créés : ${createdEmps}`);
        console.log(`Employés (Comité Régional) mis à jour/réconduits : ${updatedEmps}`);
        console.log(`Anciens Employés archivés (mandatFin & estRenouvele:false) : ${archivedEmps}`);

    } catch (err: any) {
        console.error("Script failed:", err.message);
    }
    process.exit(0);
}

syncData();

import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

async function checkDuplicates() {
    console.log("Checking for duplicates...");
    const chiefsSnap = await db.collection('chiefs').get();
    const allChiefs = chiefsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const nameGroups = new Map<string, any[]>();
    for (const c of allChiefs) {
        if (!c.name) continue;
        const normName = normalizeName(c.name);
        if (!nameGroups.has(normName)) {
            nameGroups.set(normName, []);
        }
        nameGroups.get(normName)!.push(c);
    }

    const duplicateGroups = Array.from(nameGroups.values()).filter(group => group.length > 1);
    
    let count = 0;
    for (const group of duplicateGroups) {
        count++;
        console.log(`\nDuplicate Group (${group[0].name}):`);
        for (const c of group) {
            console.log(`- ID: ${c.id} | cnrctAffiliation: ${c.cnrctAffiliation} | source: ${c.source} | contact: ${c.contact} | dept: ${c.department}`);
        }
    }
    console.log(`\nFound ${duplicateGroups.length} groups of duplicated chiefs.`);

    // Check Employees
    const empSnap = await db.collection('employees').get();
    const allEmps = empSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const empGroups = new Map<string, any[]>();
    for (const e of allEmps) {
        if (!e.name) continue;
        const normName = normalizeName(e.name);
        if (!empGroups.has(normName)) {
            empGroups.set(normName, []);
        }
        empGroups.get(normName)!.push(e);
    }
    
    const duplicateEmpGroups = Array.from(empGroups.values()).filter(group => group.length > 1);
    console.log(`\nFound ${duplicateEmpGroups.length} groups of duplicated employees.`);
    for (const group of duplicateEmpGroups) {
        console.log(`\nEmp Duplicate Group (${group[0].name}):`);
        for (const e of group) {
            console.log(`- ID: ${e.id} | poste: ${e.poste} | estRenouvele: ${e.estRenouvele}`);
        }
    }
}
checkDuplicates();

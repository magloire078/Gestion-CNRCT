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

async function mergeDuplicates() {
    console.log("Starting merge process...");
    
    // EMPLOYEES
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
    
    let empsMerged = 0;
    let empsDeleted = 0;

    for (const group of duplicateEmpGroups) {
        if (group[0].name.toLowerCase().includes("non pourvu")) continue; // Skip Non Pourvu
        
        // Find the "oldest/primary" profile.
        // We assume the new ones created today have a specific matricule format (e.g. 'CR-xxxxxx')
        // Or we just pick the one that has historical info (not recently created)
        const newProfiles = group.filter(e => e.matricule && String(e.matricule).startsWith('CR-'));
        const oldProfiles = group.filter(e => !(e.matricule && String(e.matricule).startsWith('CR-')));
        
        if (newProfiles.length > 0 && oldProfiles.length > 0) {
            // Merge the most recent new profile into the first old profile
            const primary = oldProfiles[0];
            const source = newProfiles[newProfiles.length - 1]; // The latest created
            
            // What to copy: Region, Departement, Village, mobile, mandatDebut, estRenouvele
            const updates: any = {};
            if (source.Region) updates.Region = source.Region;
            if (source.Departement) updates.Departement = source.Departement;
            if (source.Village) updates.Village = source.Village;
            if (source.mobile) updates.mobile = source.mobile;
            if (source.chiefId) updates.chiefId = source.chiefId;
            if (source.mandatDebut) updates.mandatDebut = source.mandatDebut;
            updates.estRenouvele = source.estRenouvele !== undefined ? source.estRenouvele : true;
            
            // Delete mandatFin if it was set on the old one
            updates.mandatFin = admin.firestore.FieldValue.delete();
            
            console.log(`Merging Employee ${primary.name}: ID ${source.id} -> ID ${primary.id}`);
            
            // Perform update
            await db.collection('employees').doc(primary.id).update(updates);
            empsMerged++;
            
            // Delete ALL new profiles in this group
            for (const np of newProfiles) {
                await db.collection('employees').doc(np.id).delete();
                empsDeleted++;
            }
        } else if (newProfiles.length > 1) {
            // All are new profiles (duplicates created by my script alone, e.g. due to duplicate lines in TSV)
            const primary = newProfiles[0];
            for (let i = 1; i < newProfiles.length; i++) {
                console.log(`Deleting duplicate new Employee ${newProfiles[i].name} (ID: ${newProfiles[i].id})`);
                await db.collection('employees').doc(newProfiles[i].id).delete();
                empsDeleted++;
            }
        }
    }

    // CHIEFS
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
    
    let chiefsMerged = 0;
    let chiefsDeleted = 0;

    for (const group of duplicateGroups) {
        if (group[0].name.toLowerCase().includes("non pourvu")) continue;
        
        // Find new profiles (source: 'Import Comité Régional 2026')
        const newProfiles = group.filter(c => c.source === 'Import Comité Régional 2026');
        const oldProfiles = group.filter(c => c.source !== 'Import Comité Régional 2026');
        
        if (newProfiles.length > 0 && oldProfiles.length > 0) {
            const primary = oldProfiles[0];
            const source = newProfiles[newProfiles.length - 1];
            
            const updates: any = {};
            if (source.region) updates.region = source.region;
            if (source.department) updates.department = source.department;
            if (source.village) updates.village = source.village;
            if (source.contact) updates.contact = source.contact;
            if (source.cnrctAffiliation) updates.cnrctAffiliation = source.cnrctAffiliation;
            if (source.mandatDebut) updates.mandatDebut = source.mandatDebut;
            updates.estRenouvele = source.estRenouvele !== undefined ? source.estRenouvele : true;
            
            console.log(`Merging Chief ${primary.name}: ID ${source.id} -> ID ${primary.id}`);
            
            await db.collection('chiefs').doc(primary.id).update(updates);
            chiefsMerged++;
            
            for (const np of newProfiles) {
                await db.collection('chiefs').doc(np.id).delete();
                chiefsDeleted++;
            }
        } else if (newProfiles.length > 1) {
            // All new
            const primary = newProfiles[0];
            for (let i = 1; i < newProfiles.length; i++) {
                console.log(`Deleting duplicate new Chief ${newProfiles[i].name} (ID: ${newProfiles[i].id})`);
                await db.collection('chiefs').doc(newProfiles[i].id).delete();
                chiefsDeleted++;
            }
        }
    }

    console.log(`\n=== BILAN FUSION ===`);
    console.log(`Employés fusionnés/mis à jour: ${empsMerged}`);
    console.log(`Employés en double supprimés: ${empsDeleted}`);
    console.log(`Chefs fusionnés/mis à jour: ${chiefsMerged}`);
    console.log(`Chefs en double supprimés: ${chiefsDeleted}`);

    process.exit(0);
}

mergeDuplicates();

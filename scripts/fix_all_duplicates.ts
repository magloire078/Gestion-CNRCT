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

async function fixAllDuplicates() {
    console.log("Starting full merge process...");
    
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
        
        // Sort by how much data they have, so we keep the most "complete" profile
        // Prefer profiles that have an affiliation, contact, source
        const sortedGroup = group.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            if (a.cnrctAffiliation && a.cnrctAffiliation !== 'Aucune') scoreA += 10;
            if (b.cnrctAffiliation && b.cnrctAffiliation !== 'Aucune') scoreB += 10;
            
            if (a.contact && !a.contact.includes('NON DÉFINI')) scoreA += 5;
            if (b.contact && !b.contact.includes('NON DÉFINI')) scoreB += 5;
            
            if (a.source) scoreA += 2;
            if (b.source) scoreB += 2;

            if (a.phone) scoreA += 5;
            if (b.phone) scoreB += 5;
            
            return scoreB - scoreA; // descending
        });

        const primary = sortedGroup[0];
        const duplicates = sortedGroup.slice(1);
        
        // Merge data from duplicates into primary if primary is missing it
        const updates: any = {};
        for (const dup of duplicates) {
            if (!primary.region && dup.region) updates.region = dup.region;
            if (!primary.department && dup.department) updates.department = dup.department;
            if (!primary.village && dup.village) updates.village = dup.village;
            if (!primary.subPrefecture && dup.subPrefecture) updates.subPrefecture = dup.subPrefecture;
            if ((!primary.contact || primary.contact.includes('NON DÉFINI')) && dup.contact && !dup.contact.includes('NON DÉFINI')) updates.contact = dup.contact;
            if (!primary.phone && dup.phone) updates.phone = dup.phone;
            if ((!primary.cnrctAffiliation || primary.cnrctAffiliation === 'Aucune') && dup.cnrctAffiliation && dup.cnrctAffiliation !== 'Aucune') updates.cnrctAffiliation = dup.cnrctAffiliation;
        }

        if (Object.keys(updates).length > 0) {
            console.log(`Updating primary Chief ${primary.name} (ID: ${primary.id}) with:`, updates);
            await db.collection('chiefs').doc(primary.id).update(updates);
            chiefsMerged++;
        }

        // Delete all duplicates
        for (const dup of duplicates) {
            console.log(`Deleting duplicate Chief ${dup.name} (ID: ${dup.id})`);
            await db.collection('chiefs').doc(dup.id).delete();
            chiefsDeleted++;
        }
    }

    console.log(`\n=== BILAN FUSION ===`);
    console.log(`Chefs mis à jour (enrichis): ${chiefsMerged}`);
    console.log(`Chefs en double supprimés: ${chiefsDeleted}`);

    process.exit(0);
}

fixAllDuplicates();

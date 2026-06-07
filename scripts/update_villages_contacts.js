const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

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

function normalizeName(name) {
    if (!name) return "";
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

async function run() {
    try {
        const rawPath = path.join(process.cwd(), 'data', 'raw_list.txt');
        const lines = fs.readFileSync(rawPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
        
        const chiefsSnap = await db.collection('chiefs').get();
        const allChiefs = chiefsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const empSnap = await db.collection('employees').get();
        const allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Only consider the newly created ones
        const allMembers = allEmployees.filter(e => e.poste === 'Membre Comité Régional' || e.poste?.includes('Comité Régional') || e.poste === 'Membre ComitǸ RǸgional' || e.poste?.includes('RǸgional'));

        let updatedChiefs = 0;
        let updatedEmps = 0;

        for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length < 6) continue;

            const tsvRegion = parts[1].trim();
            const tsvDept = parts[2].trim();
            const tsvLast = parts[3].trim();
            const tsvFirst = parts[4].trim();
            const rawLocalite = parts[5].trim();
            const contact = parts[6] ? parts[6].trim() : '';

            // extract village
            let village = rawLocalite.replace(/Chef du village de |Chef du village d' |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village|Chef central de /gi, "").trim();
            if (village.toLowerCase().startsWith("d'") || village.toLowerCase().startsWith("d’")) {
                village = village.substring(2).trim();
            }
            if (village.toLowerCase().startsWith("d ")) {
                village = village.substring(2).trim();
            }
            village = village.charAt(0).toUpperCase() + village.slice(1);

            // Let's try to find them in chiefs
            const normLast = normalizeName(tsvLast);
            const normFirst = normalizeName(tsvFirst);

            // Find in chiefs
            const matchedChiefs = allChiefs.filter(c => {
                const cNormLast = normalizeName(c.lastName || '');
                const cNormFirst = normalizeName(c.firstName || '');
                const cNormName = normalizeName(c.name || '');

                const hasMatch = (cNormLast.includes(normLast) || normLast.includes(cNormLast)) && 
                                 ((normFirst && cNormFirst && (cNormFirst.includes(normFirst) || normFirst.includes(cNormFirst))) || 
                                  (normFirst && cNormName.includes(normFirst)));
                
                return hasMatch;
            });

            if (matchedChiefs.length > 0) {
                for (const mc of matchedChiefs) {
                    await db.collection('chiefs').doc(mc.id).update({
                        village: village,
                        contact: contact,
                        region: tsvRegion,
                        department: tsvDept
                    });
                    updatedChiefs++;
                }
            } else {
                console.log(`Chief not found for: ${tsvLast} ${tsvFirst} (${tsvDept})`);
            }

            // Find in employees
            const matchedEmps = allMembers.filter(e => {
                const eNormLast = normalizeName(e.lastName || '');
                const eNormFirst = normalizeName(e.firstName || '');
                const eNormName = normalizeName(e.name || '');

                const hasMatch = (eNormLast.includes(normLast) || normLast.includes(eNormLast)) && 
                                 ((normFirst && eNormFirst && (eNormFirst.includes(normFirst) || normFirst.includes(eNormFirst))) || 
                                  (normFirst && eNormName.includes(normFirst)));
                return hasMatch;
            });

            if (matchedEmps.length > 0) {
                for (const me of matchedEmps) {
                    await db.collection('employees').doc(me.id).update({
                        Village: village,
                        mobile: contact,
                        Region: tsvRegion,
                        Departement: tsvDept
                    });
                    updatedEmps++;
                }
            } else {
                console.log(`Employee not found for: ${tsvLast} ${tsvFirst}`);
            }
        }

        console.log(`Updated Chiefs: ${updatedChiefs}`);
        console.log(`Updated Employees: ${updatedEmps}`);

    } catch (e) {
        console.error(e);
    }
}

run();

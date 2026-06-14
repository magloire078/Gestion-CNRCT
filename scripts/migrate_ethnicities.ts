import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Firebase
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

import { ethnicities } from '../src/lib/ivory-coast-ethnicities';

function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

const ethnicityMap = new Map<string, string>();
for (const eth of ethnicities) {
    ethnicityMap.set(normalize(eth.name), eth.name);
}

// Exceptions manuelles fréquentes (pour les erreurs courantes)
const manualMapping: Record<string, string> = {
    'akan': 'Baoulé', // Si un chef a juste mis "Akan", on ne peut pas être sûr, mais ignorons pour l'instant
    'appolo': 'Nzima (Appolo)',
    'nzema': 'Nzima (Appolo)',
    'yacouba': 'Dan (Yacouba)',
    'wobe': 'Wê (Wobé)',
    'guere': 'Wê (Guéré)'
};

async function migrate() {
    console.log("Migration des ethnies...");
    let updatedChiefs = 0;
    let updatedVillages = 0;
    let updatedCustoms = 0;

    // 1. Chiefs
    const chiefsSnap = await db.collection('chiefs').get();
    for (const doc of chiefsSnap.docs) {
        const chief = doc.data();
        if (chief.ethnicGroup) {
            const norm = normalize(chief.ethnicGroup);
            let targetName = ethnicityMap.get(norm) || manualMapping[norm];
            
            // Si pas de correspondance exacte, on cherche une ethnie qui "contient" ou "est contenue"
            if (!targetName) {
                for (const eth of ethnicities) {
                    if (chief.ethnicGroup.toLowerCase().includes(eth.name.toLowerCase()) || eth.name.toLowerCase().includes(chief.ethnicGroup.toLowerCase())) {
                        targetName = eth.name;
                        break;
                    }
                }
            }

            if (targetName && targetName !== chief.ethnicGroup) {
                await doc.ref.update({ ethnicGroup: targetName });
                console.log(`Chief ${chief.name}: ${chief.ethnicGroup} -> ${targetName}`);
                updatedChiefs++;
            }
        }
    }

    // 2. Villages
    const villagesSnap = await db.collection('villages').get();
    for (const doc of villagesSnap.docs) {
        const village = doc.data();
        if (village.mainEthnicGroups && Array.isArray(village.mainEthnicGroups)) {
            let changed = false;
            const newGroups = village.mainEthnicGroups.map((group: string) => {
                const norm = normalize(group);
                let targetName = ethnicityMap.get(norm) || manualMapping[norm];
                if (!targetName) {
                    for (const eth of ethnicities) {
                        if (group.toLowerCase().includes(eth.name.toLowerCase()) || eth.name.toLowerCase().includes(group.toLowerCase())) {
                            targetName = eth.name;
                            break;
                        }
                    }
                }
                if (targetName && targetName !== group) {
                    changed = true;
                    return targetName;
                }
                return group;
            });

            if (changed) {
                await doc.ref.update({ mainEthnicGroups: newGroups });
                console.log(`Village ${village.name}: ${village.mainEthnicGroups.join(', ')} -> ${newGroups.join(', ')}`);
                updatedVillages++;
            }
        }
    }

    // 3. Us et Coutumes
    const customsSnap = await db.collection('customs').get();
    for (const doc of customsSnap.docs) {
        const custom = doc.data();
        if (custom.ethnicGroup) {
            const norm = normalize(custom.ethnicGroup);
            let targetName = ethnicityMap.get(norm) || manualMapping[norm];
            if (!targetName) {
                for (const eth of ethnicities) {
                    if (custom.ethnicGroup.toLowerCase().includes(eth.name.toLowerCase()) || eth.name.toLowerCase().includes(custom.ethnicGroup.toLowerCase())) {
                        targetName = eth.name;
                        break;
                    }
                }
            }
            if (targetName && targetName !== custom.ethnicGroup) {
                await doc.ref.update({ ethnicGroup: targetName });
                console.log(`Custom ${doc.id}: ${custom.ethnicGroup} -> ${targetName}`);
                updatedCustoms++;
            }
        }
    }

    console.log(`\nMigration terminée :`);
    console.log(`- Chefs mis à jour : ${updatedChiefs}`);
    console.log(`- Villages mis à jour : ${updatedVillages}`);
    console.log(`- Us et Coutumes mis à jour : ${updatedCustoms}`);
    process.exit(0);
}

migrate();

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

// Load divisions to find unique villages
import { divisions } from '../src/lib/ivory-coast-divisions';

// Build a map of village name (lowercase, no accents) to its full location
// If a village name appears in multiple sub-prefectures, we mark it as ambiguous.
const villageLocationMap = new Map<string, { region: string, department: string, subPrefecture: string, isUnique: boolean }>();

function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

for (const region of Object.keys(divisions)) {
    for (const department of Object.keys(divisions[region])) {
        for (const subPrefecture of Object.keys(divisions[region][department])) {
            for (const village of divisions[region][department][subPrefecture]) {
                const normName = normalize(village);
                if (villageLocationMap.has(normName)) {
                    // It's ambiguous!
                    const existing = villageLocationMap.get(normName)!;
                    // If it's the exact same location, it's fine, otherwise mark as not unique
                    if (existing.subPrefecture !== subPrefecture || existing.department !== department || existing.region !== region) {
                        existing.isUnique = false;
                    }
                } else {
                    villageLocationMap.set(normName, { region, department, subPrefecture, isUnique: true });
                }
            }
        }
    }
}

async function fixChiefsLocation() {
    console.log("Fetching chiefs...");
    const snap = await db.collection('chiefs').get();
    let updatedCount = 0;

    for (const doc of snap.docs) {
        const chief = doc.data();
        let needsUpdate = false;
        let updateData: any = {};

        // Specifically fix Yedess Agnimel typo if present
        if (chief.name && chief.name.toLowerCase().includes('yedess agnimel') && normalize(chief.village || '') === 'boubdoury') {
            console.log(`Found Yedess Agnimel with typo Boubdoury. Fixing to Bouboury.`);
            chief.village = 'Bouboury';
            updateData.village = 'Bouboury';
            needsUpdate = true;
        }

        const village = chief.village;
        if (!village) continue;

        const normVillage = normalize(village);
        const loc = villageLocationMap.get(normVillage);

        if (loc && loc.isUnique) {
            let updatedLoc = false;
            if (chief.region !== loc.region) {
                updateData.region = loc.region;
                updatedLoc = true;
            }
            if (chief.department !== loc.department) {
                updateData.department = loc.department;
                updatedLoc = true;
            }
            if (chief.subPrefecture !== loc.subPrefecture) {
                updateData.subPrefecture = loc.subPrefecture;
                updatedLoc = true;
            }

            if (updatedLoc) {
                console.log(`Updating location for chief: ${chief.name} (Village: ${village}) -> ${loc.region} / ${loc.department} / ${loc.subPrefecture}`);
                needsUpdate = true;
            }
        } else if (loc && !loc.isUnique) {
            // Village is not unique. Only update if the chief lacks info and we can't decide?
            // If they already have some info, maybe we can match it.
            // But the user said "s'il n'y a pas par exemple deux villages bouboury" -> which implies we only do it if it's unique.
        }

        if (needsUpdate) {
            await doc.ref.update(updateData);
            updatedCount++;
        }
    }

    console.log(`\nLocation update complete. Updated ${updatedCount} chiefs.`);
    process.exit(0);
}

fixChiefsLocation();

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const adminDb = admin.firestore();

function slugify(text: string): string {
    if (!text) return "";
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function syncVillageIds() {
    console.log("Syncing Village IDs for NAWA chiefs...");
    
    // Fetch all NAWA chiefs
    const chiefsSnap = await adminDb.collection("chiefs").where("region", "==", "Nawa").get();
    
    // Fetch all NAWA villages
    const villagesSnap = await adminDb.collection("villages").where("region", "==", "Nawa").get();
    
    const villageLookup: Record<string, any> = {};
    villagesSnap.forEach(snap => {
        const v = snap.data();
        const key = `${slugify(v.name)}-${slugify(v.department)}`;
        villageLookup[key] = { id: snap.id, ...v };
        
        // Also just by name as fallback
        villageLookup[slugify(v.name)] = { id: snap.id, ...v };
    });

    let matched = 0;
    let created = 0;
    
    const batch = adminDb.batch();

    for (const doc of chiefsSnap.docs) {
        const chief = doc.data();
        if (chief.villageId) continue; // Already synced
        
        const strictKey = `${slugify(chief.village)}-${slugify(chief.department)}`;
        const fallbackKey = slugify(chief.village);
        
        let matchingVillage = villageLookup[strictKey] || villageLookup[fallbackKey];
        
        if (matchingVillage) {
            batch.update(doc.ref, { villageId: matchingVillage.id });
            matched++;
        } else {
            // Village doesn't exist in our DB, we must create it!
            const newVillageRef = adminDb.collection("villages").doc();
            const now = new Date().toISOString();
            
            const newVillageData = {
                name: chief.village,
                subPrefecture: chief.subPrefecture || chief.department, // fallback
                department: chief.department,
                region: chief.region,
                district: "Bas-Sassandra", // Nawa is in Bas-Sassandra district
                subPrefectureId: chief.subPrefectureId,
                departmentId: chief.departmentId,
                regionId: chief.regionId,
                districtId: "dist-bas-sassandra",
                hasElectricity: false,
                hasWater: false,
                hasHealthCenter: false,
                hasSchool: false,
                hasMarket: false,
                hasMosque: false,
                hasChurch: false,
                developmentScore: 0,
                createdAt: now,
                updatedAt: now
            };
            
            batch.set(newVillageRef, newVillageData);
            batch.update(doc.ref, { villageId: newVillageRef.id });
            
            // Add to lookup for subsequent chiefs
            villageLookup[strictKey] = { id: newVillageRef.id, ...newVillageData };
            created++;
        }
    }
    
    await batch.commit();
    console.log(`Synced ${matched} chiefs to existing villages.`);
    console.log(`Created ${created} missing villages and synced them.`);
}

syncVillageIds().catch(console.error);

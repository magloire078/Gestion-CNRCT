import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Load env variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
        }
    });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
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

const db = admin.firestore();

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function linkVillages() {
    try {
        console.log("Fetching all chiefs of Grands-Ponts...");
        const chiefsSnapshot = await db.collection('chiefs')
            .where('regionId', '==', 'reg-grands-ponts')
            .get();

        console.log(`Found ${chiefsSnapshot.size} chiefs of Grands-Ponts to process.`);

        let linkedCount = 0;
        let createdCount = 0;

        for (const chiefDoc of chiefsSnapshot.docs) {
            const chiefData = chiefDoc.data();
            const chiefId = chiefDoc.id;
            const villageName = chiefData.village;
            const chiefName = chiefData.name;

            if (!villageName) {
                console.log(`  [SKIP] Chief "${chiefName}" has no village name set.`);
                continue;
            }

            // Search for an existing village with the same name and in the same region
            const villagesSnapshot = await db.collection('villages')
                .where('name', '==', villageName)
                .where('regionId', '==', 'reg-grands-ponts')
                .get();

            let villageId = "";

            if (!villagesSnapshot.empty) {
                // If there are multiple, try to find the one in the same department
                let matchedDoc = villagesSnapshot.docs[0];
                if (villagesSnapshot.size > 1 && chiefData.departmentId) {
                    const deptMatch = villagesSnapshot.docs.find(doc => doc.data().departmentId === chiefData.departmentId);
                    if (deptMatch) matchedDoc = deptMatch;
                }
                villageId = matchedDoc.id;
                console.log(`  [LINK] Linked "${chiefName}" to existing village "${villageName}" (ID: ${villageId})`);
                linkedCount++;
            } else {
                // Create a new village document
                const now = new Date().toISOString();
                const newVillageData = {
                    name: villageName,
                    region: "Grands-Ponts",
                    regionId: "reg-grands-ponts",
                    department: chiefData.department || "Dabou",
                    departmentId: chiefData.departmentId || "dept-dabou",
                    subPrefecture: chiefData.subPrefecture || "Dabou",
                    subPrefectureId: chiefData.subPrefectureId || "sp-dabou-c",
                    district: "Lagunes",
                    districtId: "dist-lagunes",
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

                const newVillageRef = await db.collection('villages').add(newVillageData);
                villageId = newVillageRef.id;
                console.log(`  [NEW] Created and linked new village "${villageName}" (ID: ${villageId}) for chief "${chiefName}"`);
                createdCount++;
            }

            // Update the chief doc with the villageId reference
            await db.collection('chiefs').doc(chiefId).update({
                villageId: villageId
            });
        }

        console.log(`\n===============================`);
        console.log(`Linking process completed:`);
        console.log(`  - Linked to existing villages: ${linkedCount}`);
        console.log(`  - Created new villages & linked: ${createdCount}`);
        console.log(`  - Total processed chiefs: ${chiefsSnapshot.size}`);
        console.log(`===============================`);

        process.exit(0);

    } catch (error: any) {
        console.error("Linking process failed:", error.message);
        process.exit(1);
    }
}

linkVillages();

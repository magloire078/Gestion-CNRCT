import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// Load .env.local
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

const db = admin.firestore();

function normalize(str: string | undefined): string {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, ''); // keep only alphanum
}

async function cleanupDuplicates() {
    console.log("Fetching all villages...");
    const snapshot = await db.collection('villages').get();
    
    // Group by unique signature
    const groups: Record<string, FirebaseFirestore.QueryDocumentSnapshot[]> = {};
    
    snapshot.forEach(doc => {
        const v = doc.data();
        const reg = normalize(v.region);
        const dept = normalize(v.department);
        const sp = normalize(v.subPrefecture || v.commune);
        const name = normalize(v.name);
        
        const key = `${reg}_${dept}_${sp}_${name}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
    });

    console.log(`Total villages found: ${snapshot.size}`);
    console.log(`Unique village signatures: ${Object.keys(groups).length}`);
    
    let deletedCount = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const key in groups) {
        const docs = groups[key];
        if (docs.length > 1) {
            // Keep the first one (or the one that looks most complete, but for now just the first one)
            // Sort by creation date if possible
            docs.sort((a, b) => {
                const timeA = a.data().audit?.createdAt ? new Date(a.data().audit.createdAt).getTime() : 0;
                const timeB = b.data().audit?.createdAt ? new Date(b.data().audit.createdAt).getTime() : 0;
                return timeA - timeB;
            });

            // Keep the first, delete the rest
            const toDelete = docs.slice(1);
            for (const doc of toDelete) {
                batch.delete(doc.ref);
                deletedCount++;
                batchCount++;

                if (batchCount === 400) {
                    await batch.commit();
                    batchCount = 0;
                    console.log(`Committed batch, deleted ${deletedCount} so far...`);
                }
            }
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`Cleanup complete! Deleted ${deletedCount} duplicate villages.`);
}

cleanupDuplicates().then(() => process.exit(0)).catch(console.error);

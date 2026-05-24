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

async function analyzeSoubre() {
    console.log("Analyzing Soubré...");
    const snapshot = await db.collection('villages').where('department', '==', 'SOUBRE').get();
    
    let subPrefCount = 0;
    const villageNames = [];
    const duplicates: Record<string, number> = {};

    snapshot.forEach(doc => {
        const v = doc.data();
        // Soubré could be spelled differently: SOUBRE, Soubré, etc.
        const sp = (v.subPrefecture || v.commune || '').toUpperCase();
        if (sp === 'SOUBRE' || sp === 'SOUBRÉ') {
            subPrefCount++;
            const name = v.name.toUpperCase();
            if (duplicates[name]) {
                duplicates[name]++;
            } else {
                duplicates[name] = 1;
                villageNames.push(name);
            }
        }
    });

    console.log(`Total Department SOUBRE (all SP): ${snapshot.size}`);
    console.log(`Total Sub-prefecture SOUBRE: ${subPrefCount}`);
    
    const dups = Object.entries(duplicates).filter(([k, v]) => (v as number) > 1);
    console.log(`Unique villages in SP: ${villageNames.length}`);
    console.log(`Duplicates found: ${dups.length}`);
    if (dups.length > 0) {
        console.log("Top duplicates:", dups.sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10));
    }
}

analyzeSoubre().then(() => process.exit(0)).catch(console.error);

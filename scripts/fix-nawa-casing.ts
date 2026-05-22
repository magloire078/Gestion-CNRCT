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

async function fixCasing() {
    console.log("Fixing NAWA chiefs casing...");
    const snap = await adminDb.collection("chiefs").where("region", "==", "NAWA").get();
    console.log(`Found ${snap.size} chiefs to fix.`);
    
    const batch = adminDb.batch();
    snap.forEach(doc => {
        const data = doc.data();
        let dept = data.department;
        if (dept === "SASSANDRA") dept = "Sassandra";
        if (dept === "SOUBRE") dept = "Soubré";
        if (dept === "GUEYO") dept = "Guéyo";
        
        batch.update(doc.ref, {
            region: "Nawa",
            department: dept
        });
    });
    
    await batch.commit();
    console.log("Fix complete.");
}

fixCasing().catch(console.error);

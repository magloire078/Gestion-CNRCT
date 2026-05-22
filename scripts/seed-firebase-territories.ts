import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
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

// Initialize Firebase Admin directly
if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        // Remove wrapping quotes if they exist (both single and double)
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

async function seedCollection(collectionName: string, dataFile: string) {
    const dataPath = path.join(process.cwd(), 'data', dataFile);
    if (!fs.existsSync(dataPath)) {
        console.error(`File ${dataPath} not found.`);
        return;
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const items = JSON.parse(rawData);
    
    console.log(`Seeding ${items.length} items to ${collectionName}...`);
    
    const batchSize = 500;
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = adminDb.batch();
        const chunk = items.slice(i, i + batchSize);
        
        chunk.forEach((item: any) => {
            const docRef = adminDb.collection(collectionName).doc(item.id);
            batch.set(docRef, item);
        });
        
        await batch.commit();
        console.log(`Committed batch ${i / batchSize + 1}`);
    }
    console.log(`Finished seeding ${collectionName}.`);
}

async function main() {
    console.log('Starting Firebase Territory Seeding...');
    try {
        await seedCollection('districts', 'districts.json');
        await seedCollection('regions', 'regions.json');
        await seedCollection('departments', 'departements.json');
        await seedCollection('subPrefectures', 'sous_prefectures.json');
        console.log('All territories seeded successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    }
}

main().catch(console.error);

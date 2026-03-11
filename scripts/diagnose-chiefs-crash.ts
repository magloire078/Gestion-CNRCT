import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function diagnoseChiefs() {
    console.log(`Diagnosing chiefs in ${FIREBASE_PROJECT_ID}...`);

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/chiefs?pageSize=1000`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.documents) {
        console.log("No documents found or error.");
        return;
    }

    let corruptedCount = 0;
    const requiredFields = ['name', 'title', 'role', 'region', 'department', 'village'];

    data.documents.forEach((doc: any) => {
        const fields = doc.fields || {};
        const missing: string[] = [];

        requiredFields.forEach(f => {
            if (!fields[f]) missing.push(f);
        });

        if (missing.length > 0) {
            console.log(`[CORRUPTED] Document ${doc.name.split('/').pop()} is missing: ${missing.join(', ')}`);
            corruptedCount++;
        }
    });

    console.log(`\nDiagnostic complete: ${corruptedCount} corrupted documents found out of ${data.documents.length}.`);
}

diagnoseChiefs();

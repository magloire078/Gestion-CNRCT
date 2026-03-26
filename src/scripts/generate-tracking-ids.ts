
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Manual loading of .env.local to get projectId
const env: Record<string, string> = {};
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestion-cnrct';

// Initialize admin with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS or CLI login)
admin.initializeApp({
  projectId: projectId
});

const db = admin.firestore();

async function generateTrackingIds() {
    console.log(`Starting tracking ID generation (ADMIN) for project: ${projectId}...`);
    const conflictsRef = db.collection('conflicts');
    const snapshot = await conflictsRef.get();
    
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((document, index) => {
        const data = document.data();
        if (!data.trackingId) {
            const dateStr = data.reportedDate || '2025-01-01';
            const year = dateStr.split('-')[0];
            const sequence = (index + 1).toString().padStart(4, '0');
            const trackingId = `CNRCT-${year}-${sequence}`;
            
            batch.update(document.ref, { trackingId });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
    }
    console.log(`Success! Generated ${count} tracking IDs.`);
}

generateTrackingIds().catch(console.error);

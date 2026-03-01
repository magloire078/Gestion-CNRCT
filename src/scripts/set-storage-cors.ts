import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Path to your service account key file
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Error: serviceAccountKey.json not found at ' + SERVICE_ACCOUNT_PATH);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gestion-cnrct.appspot.com'
});

const bucket = admin.storage().bucket();

async function setCors() {
    try {
        console.log('Setting CORS configuration for bucket: gestion-cnrct.appspot.com...');
        await bucket.setCorsConfiguration([
            {
                maxAgeSeconds: 3600,
                method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                origin: ['http://localhost:9002'],
                responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'Authorization'],
            },
        ]);
        console.log('✅ CORS configuration updated successfully!');
    } catch (error) {
        console.error('❌ Error setting CORS configuration:', error);
        process.exit(1);
    }
}

setCors();

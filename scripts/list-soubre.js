const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

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

async function list() {
    const snap = await db.collection('villages').where('department', '==', 'SOUBRE').get();
    let vils = [];
    snap.forEach(doc => {
        const v = doc.data();
        if ((v.subPrefecture || '').toUpperCase() === 'SOUBRE') {
            vils.push(v.name);
        }
    });
    console.log('Count SP SOUBRE:', vils.length);
    console.log(vils.slice(0, 50).join(', '));
}

list().then(() => process.exit(0)).catch(console.error);

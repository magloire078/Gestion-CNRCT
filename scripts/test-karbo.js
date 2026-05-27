const admin = require('firebase-admin');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*)'/);
if (!match) throw new Error("Key not found");

let key = match[1];
const serviceAccount = JSON.parse(key);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    console.log("Searching for Directors...");
    const snapshot = await db.collection('employees').get();
    let found = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        const p = (data.poste || '').toLowerCase();
        if ((p.includes('directeur') || p.includes('directrice')) && !p.includes('cabinet')) {
            console.log(doc.id, " | ", data.name, " | ", data.poste, " | ", data.matricule, " | ", data.departmentId);
            found = true;
        }
    });
}

run().catch(console.error);

import * as admin from 'firebase-admin';

const k = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
let key = k;
if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(key))
});

async function main() {
  const s = await admin.firestore().collection('employees').where('name', '>=', 'ADO').limit(5).get();
  console.log(s.docs.map(d => {
    const data = d.data();
    return {
      name: data.name,
      subPrefecture: data.subPrefecture,
      Village: data.Village,
      Commune: data.Commune
    };
  }));
}

main().catch(console.error);

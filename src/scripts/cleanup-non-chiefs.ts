import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^'|^"|'$|"$/g, '');
    }
  });
}

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(certObj),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

async function main() {
  const excludedPostes = ['secrétaire', 'secretaire', 'directeur', 'directrice', 'assistant', 'chargé', 'charge'];

  console.log("Fetching chiefs to cleanup...");
  const snapshot = await db.collection('chiefs').where('cnrctAffiliation', '==', 'Directoire').get();
  
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
      const data = doc.data();
      const titleLower = (data.title || '').toLowerCase();
      
      const shouldDelete = excludedPostes.some(ep => titleLower.includes(ep));
      
      if (shouldDelete) {
          console.log(`Deleting non-chief: ${data.name} (Title: ${data.title})`);
          
          // Delete from chiefs
          await doc.ref.delete();
          
          // Remove chiefId from employees
          const employeesSnap = await db.collection('employees').where('chiefId', '==', doc.id).get();
          for (const empDoc of employeesSnap.docs) {
              await empDoc.ref.update({
                  chiefId: admin.firestore.FieldValue.delete()
              });
              console.log(`  -> Unlinked chiefId from employee ${empDoc.id}`);
          }
          deletedCount++;
      }
  }
  
  console.log(`Cleanup completed. ${deletedCount} administrative employees removed from chiefs list.`);
  process.exit(0);
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^'|^"|'$|"$/g, '');
    }
  });
}

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  let certObj;
  try {
    certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(certObj),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore();

function normalizeSexe(raw: any): 'H' | 'F' | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (['h', 'homme', 'hommes', 'm', 'masculin', 'male', 'man'].includes(s)) {
    return 'H';
  }
  if (['f', 'femme', 'femmes', 'féminin', 'feminin', 'female', 'woman'].includes(s)) {
    return 'F';
  }
  return null;
}

async function run() {
  console.log("=== Normalisation du champ sexe vers 'H' et 'F' ===");

  // 1. Employees
  console.log("\n1. Traitement de la collection 'employees'...");
  const empSnap = await db.collection('employees').get();
  let empUpdated = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const doc of empSnap.docs) {
    const data = doc.data();
    const currentSexe = data.sexe;
    const normalized = normalizeSexe(currentSexe);

    if (normalized && normalized !== currentSexe) {
      batch.update(doc.ref, { sexe: normalized });
      empUpdated++;
      opCount++;

      if (opCount >= 450) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
  console.log(`✓ ${empUpdated} employé(s) mis à jour avec succès.`);

  // 2. Chiefs
  console.log("\n2. Traitement de la collection 'chiefs'...");
  const chiefSnap = await db.collection('chiefs').get();
  let chiefUpdated = 0;
  batch = db.batch();
  opCount = 0;

  for (const doc of chiefSnap.docs) {
    const data = doc.data();
    const currentSexe = data.sexe;
    const normalized = normalizeSexe(currentSexe);

    if (normalized && normalized !== currentSexe) {
      batch.update(doc.ref, { sexe: normalized });
      chiefUpdated++;
      opCount++;

      if (opCount >= 450) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
  console.log(`✓ ${chiefUpdated} chef(s) mis à jour avec succès.`);

  console.log("\n=== Terminé avec succès ! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Erreur lors de la normalisation :", err);
  process.exit(1);
});

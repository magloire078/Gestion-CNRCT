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

// Check if admin is already initialized
if (!admin.apps.length) {
  let certObj;
  try {
    certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(certObj),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

const GROUPE_DIRECTOIRE_ID = '9ywKFDgVMS86rZLPYhpm';

async function syncEmployee(employeeDoc: admin.firestore.QueryDocumentSnapshot) {
  const employee = { id: employeeDoc.id, ...employeeDoc.data() } as any;

  const isDirectoire = employee.departmentId === GROUPE_DIRECTOIRE_ID || 
                       employee.matricule?.startsWith('D 0') || 
                       ['Membre du Directoire', 'Président', 'Secrétaire Général', 'Directrice de Cabinet', 'Directeur de Cabinet'].includes(employee.poste || '');
                       
  const isComite = employee.poste?.includes('Comité Régional');

  const isChief = employee.Region || employee.Village || employee.groupe_2 === 'Rois & Chefs' || isDirectoire || isComite;
  
  // We only sync the ones that are Directoire or Comité
  if (!isDirectoire && !isComite) return false;

  let affiliation = 'Aucune';
  if (isDirectoire) affiliation = 'Directoire';
  else if (isComite) affiliation = 'Comité Régional';

  const chiefData: any = {
      name: `${employee.lastName || ''} ${employee.firstName || ''}`.trim() || employee.name,
      firstName: employee.firstName,
      lastName: employee.lastName,
      title: employee.poste,
      role: (employee.Region && employee.Village) ? 'Chef de Village' : 'Chef de canton',
      sexe: employee.sexe,
      region: employee.Region,
      department: employee.Departement,
      subPrefecture: employee.subPrefecture,
      village: employee.Village,
      contact: employee.mobile,
      photoUrl: employee.photoUrl,
      cnrctAffiliation: affiliation
  };

  Object.keys(chiefData).forEach(k => chiefData[k] === undefined && delete chiefData[k]);

  const chiefsRef = db.collection('chiefs');

  if (employee.chiefId) {
      const existingRef = chiefsRef.doc(employee.chiefId);
      const snap = await existingRef.get();
      if (snap.exists) {
          await existingRef.update(chiefData);
          return true;
      }
  }

  const fullName = chiefData.name || '';
  if (!fullName) return false;

  const snap = await chiefsRef.where('name', '==', fullName).get();
  if (!snap.empty) {
      const existingRef = snap.docs[0].ref;
      await existingRef.update(chiefData);
      if (!employee.chiefId && employee.id) {
          await employeeDoc.ref.update({ chiefId: snap.docs[0].id });
      }
      return true;
  } else {
      const newRef = chiefsRef.doc();
      await newRef.set(chiefData);
      if (employee.id) {
          await employeeDoc.ref.update({ chiefId: newRef.id });
      }
      return true;
  }
}

async function main() {
  console.log("Fetching employees as admin...");
  const snapshot = await db.collection('employees').get();
  console.log(`Checking ${snapshot.size} employees...`);

  let successCount = 0;
  for (const doc of snapshot.docs) {
    try {
      const synced = await syncEmployee(doc);
      if (synced) {
        process.stdout.write('.');
        successCount++;
      }
    } catch (e: any) {
      console.error(`\nFailed for ${doc.id}: ${e.message}`);
    }
  }

  console.log(`\n\nSync completed: ${successCount} Directoire/Comité members synced to Chiefs.`);
  process.exit(0);
}

main().catch(console.error);

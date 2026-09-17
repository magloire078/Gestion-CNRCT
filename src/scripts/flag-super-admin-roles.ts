/**
 * Pose isSuperAdmin: true sur les rôles que firestore.rules énumérait en dur.
 *
 * Tant que ce drapeau n'est pas posé, les deux listes codées en dur dans
 * isSuperAdmin() restent indispensables : les retirer avant verrouillerait
 * les administrateurs hors de l'application. Une fois ce script exécuté et
 * l'accès administrateur vérifié, ces listes peuvent disparaître des règles.
 *
 * Exécution : npm run db:flag-super-admins
 */
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

const SUPER_ADMIN_ROLE_IDS = [
  'super-admin',
  'LHcHyfBzile3r0vyFOFb',
  'dirigeant-president',
  'administrateur',
  'admin',
];

async function main() {
  const dryRun = !process.argv.includes('--apply');
  console.log(dryRun ? '— Simulation (ajouter --apply pour écrire) —\n' : '— Écriture —\n');

  let flagged = 0;
  let missing = 0;

  for (const roleId of SUPER_ADMIN_ROLE_IDS) {
    const ref = db.collection('roles').doc(roleId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      console.log(`  absent   ${roleId}`);
      missing++;
      continue;
    }

    if (snapshot.data()?.isSuperAdmin === true) {
      console.log(`  déjà ok  ${roleId}`);
      continue;
    }

    if (!dryRun) {
      await ref.update({ isSuperAdmin: true });
    }
    console.log(`  ${dryRun ? 'à poser ' : 'posé   '} ${roleId}`);
    flagged++;
  }

  console.log(`\n${flagged} rôle(s) à marquer, ${missing} introuvable(s).`);

  if (!dryRun && flagged > 0) {
    console.log(
      "\nVérifiez qu'un administrateur se connecte toujours avant de retirer\n" +
        'les listes en dur de isSuperAdmin() dans firestore.rules.',
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

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

// DATE COMMUNE DE NOMINATION (À MODIFIER SI BESOIN)
const DATE_NOMINATION = '2024-01-01'; // Remplacez par la date du conseil de ministre (ex: 2024-05-15)

// Calcul de la date de fin (6 ans plus tard)
const dateDebut = new Date(DATE_NOMINATION);
const dateFin = new Date(dateDebut);
dateFin.setFullYear(dateFin.getFullYear() + 6);
const DATE_FIN_MANDAT = dateFin.toISOString().split('T')[0];

const CSV_FILE_PATH = path.join(process.cwd(), 'comites.csv');

async function importComites() {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error("Le fichier comites.csv est introuvable à la racine du projet.");
        process.exit(1);
    }

    const records: any[] = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csvParser())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
          console.log(`${records.length} lignes lues depuis le CSV.`);
          let added = 0;
          let updated = 0;

          for (const record of records) {
              const fullName = `${record.lastName || ''} ${record.firstName || ''}`.trim();
              if (!fullName) continue;

              const poste = record.poste || 'Membre du Comité Régional';
              
              // Search if employee exists by name
              const empSnap = await db.collection('employees').where('name', '==', fullName).get();
              
              const updateData: any = {
                  mandatDebut: DATE_NOMINATION,
                  mandatFin: DATE_FIN_MANDAT,
                  estRenouvele: false,
                  poste: poste,
                  groupe_2: 'Rois & Chefs'
              };

              if (record.Region) updateData.Region = record.Region;
              if (record.Departement) updateData.Departement = record.Departement;

              if (!empSnap.empty) {
                  // Update existing
                  const empDoc = empSnap.docs[0];
                  const existingData = empDoc.data();
                  
                  // Handle Historique si le poste change !
                  const historique = existingData.historiqueNominations || [];
                  if (existingData.poste && existingData.poste !== poste) {
                      historique.push({
                          periode: `Jusqu'au ${DATE_NOMINATION}`,
                          poste: existingData.poste,
                          region: existingData.Region || ''
                      });
                  }
                  
                  updateData.historiqueNominations = historique;

                  await empDoc.ref.update(updateData);
                  updated++;
                  console.log(`Mis à jour: ${fullName} (${poste})`);
              } else {
                  // Create new
                  updateData.name = fullName;
                  updateData.lastName = record.lastName || '';
                  updateData.firstName = record.firstName || '';
                  updateData.status = 'Actif';
                  
                  await db.collection('employees').add(updateData);
                  added++;
                  console.log(`Créé: ${fullName} (${poste})`);
              }
          }
          
          console.log(`\nImportation terminée !`);
          console.log(`- ${added} nouveaux membres créés`);
          console.log(`- ${updated} membres mis à jour (historique conservé)`);
          console.log(`\n-> Pensez à exécuter 'npx tsx src/scripts/admin-sync-chiefs.ts' pour synchroniser ces nouveautés avec l'Annuaire des Chefs.`);
          process.exit(0);
      });
}

importComites().catch(console.error);

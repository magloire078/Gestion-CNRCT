import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Load service account
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("serviceAccountKey.json not found!");
  process.exit(1);
}

const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Data parsing
const rawDataPath = path.resolve(process.cwd(), 'src/scripts/data/comites_regionaux_brut.tsv');
const rawData = fs.readFileSync(rawDataPath, 'utf8');
const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

// Skip header
const dataLines = lines.slice(1);

interface ChiefData {
  name: string;
  lastName: string;
  firstName: string;
  title: string;
  role: string;
  cnrctAffiliation: string;
  region: string;
  department: string;
  subPrefecture: string;
  village: string;
  status: 'actif' | 'archive';
  archiveReason?: string;
  archiveNote?: string;
  bio: string;
  photoUrl: string;
  contact: string;
  createdAt: string;
  updatedAt: string;
}

async function runImport() {
  console.log(`Starting import of ${dataLines.length} rows using Firebase Admin...`);
  let addedCount = 0;
  let skippedCount = 0;

  for (const line of dataLines) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    
    const rawName = parts[1].trim();
    const rawRegion = parts[2].trim();
    const rawDept = parts[3].trim();
    const rawObs = parts[4] ? parts[4].trim() : '';

    if (rawName.toUpperCase().includes('NON POURVU')) {
      console.log(`Skipping vacant seat: ${rawRegion} / ${rawDept}`);
      skippedCount++;
      continue;
    }

    const nameParts = rawName.split(' ');
    const lastName = nameParts[0] || '';
    const firstName = nameParts.slice(1).join(' ') || '';

    let status: 'actif' | 'archive' = 'actif';
    let archiveReason: string | undefined = undefined;
    let archiveNote: string | undefined = undefined;

    const obsLower = rawObs.toLowerCase();
    if (obsLower.includes('décédé')) {
      status = 'archive';
      archiveReason = 'Décès';
    } else if (obsLower.includes('démissionnaire')) {
      status = 'archive';
      archiveReason = 'Démission';
    } else if (obsLower.includes('générationnel')) {
      status = 'archive';
      archiveReason = 'Succession générationnelle';
    } else if (obsLower.includes('a pourvoir')) {
      status = 'archive';
      archiveReason = 'Autre';
      archiveNote = rawObs;
    }

    const chiefData: ChiefData = {
      name: rawName,
      lastName,
      firstName,
      title: "Membre du Comité Régional",
      role: "Chef de Village",
      cnrctAffiliation: "Comité Régional",
      region: rawRegion,
      department: rawDept,
      subPrefecture: "NON DÉFINIE",
      village: "NON DÉFINI",
      status,
      bio: rawObs,
      photoUrl: "https://placehold.co/400x400/png?text=" + lastName.charAt(0) + (firstName.charAt(0) || ''),
      contact: "NON DÉFINI",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (archiveReason) chiefData.archiveReason = archiveReason;
    if (archiveNote) chiefData.archiveNote = archiveNote;

    // Deduplication check
    const existing = await db.collection('chiefs')
      .where('name', '==', rawName)
      .where('cnrctAffiliation', '==', 'Comité Régional')
      .get();

    if (!existing.empty) {
      console.log(`Skipping duplicate: ${rawName}`);
      skippedCount++;
      continue;
    }

    try {
      await db.collection('chiefs').add(chiefData);
      addedCount++;
      console.log(`Added: ${rawName} (${status})`);
    } catch (e: any) {
      console.error(`Error adding ${rawName}: ${e.message}`);
    }
  }

  console.log(`Import finished! Added: ${addedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

runImport();

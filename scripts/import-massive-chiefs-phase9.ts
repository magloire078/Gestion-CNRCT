import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

interface ChiefData {
    nom: string;
    prenoms: string;
    village: string;
    arrete: string;
    departement: string;
    region: string;
}

const chiefsToImport: ChiefData[] = [
    { nom: "BAMBA", prenoms: "FALIKOU", village: "SERIFINA", arrete: "ARRETE N° 11/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SEBE", village: "GOUAN", arrete: "ARRETE N° 016/P-OUA/SG", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VAYA", village: "SOULA", arrete: "ARRETE N° 014/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LAHOULA", village: "BORONTOULO", arrete: "ARRETE N° 20/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VAGONDO", village: "BANANGORO", arrete: "ARRETE N° 013/P-OUA/SG", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LASSINA", village: "VACERISSO", arrete: "ARRETE N° 16/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "GONDIE", village: "FOUANA", arrete: "ARRETE N° 016/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LANCINE", village: "BASSAM", arrete: "ARRETE N° 019/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "ABDOULAYE", village: "SILAKORO-MOAMBASSO", arrete: "ARRETE N° 48/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "BAYO", prenoms: "TIENENE", village: "FAALA", arrete: "ARRETE N° 037/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAYO", prenoms: "KOKO", village: "YAMATOULO", arrete: "ARRETE N° 027/RB/PT/SG1", departement: "TOUBA", region: "BAFING" },
    { nom: "BAYOKO", prenoms: "DOH", village: "GUE", arrete: "ARRETE N° 006/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BOIKE", prenoms: "BAMBA", village: "SAGBANIKORO", arrete: "ARRETE N° 16/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "BOUHET", prenoms: "LUCIEN", village: "BOUNTOU", arrete: "ARRETE N° 17/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "CHERIF", prenoms: "VAKO", village: "MAMOUESSO", arrete: "ARRETE N° 26/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "CHERIFOU", prenoms: "MAMADOU", village: "SILAKORO-GANHOUE", arrete: "ARRETE N° 016/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "DAOUDA", prenoms: "DIOMANDE", village: "BOOKO", arrete: "ARRETE N° 49/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIABATE", prenoms: "VASSAKA", village: "DANDUY", arrete: "ARRETE N° 015/RB/PT/SG1", departement: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BOURAHIMA", village: "TIENLO", arrete: "ARRETE N° 27/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YACOUBA", village: "MOAKO-BOOKO", arrete: "ARRETE N° 22/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOHAMED ISAAC", village: "MAHANDOUGOU", arrete: "ARRETE N° 02/RBAF/DKOR/P-KOR/CAB", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", village: "BONANGORO", arrete: "ARRETE N° 47/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BOIKE", village: "BLAMADOUGOU", arrete: "ARRETE N° 09/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", village: "MASSALA-SOKOURANI", arrete: "ARRETE N° 60/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", village: "DIABISSEDOUGOU", arrete: "ARRETE N° 50/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "AMARA", village: "DIALA", arrete: "ARRETE N° 23/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LASSINA", village: "MASSALA-BARALA", arrete: "ARRETE N° 30/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YANGOUBA", village: "BLANDOUGOU", arrete: "ARRETE N° 19/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", village: "DIENGUERE", arrete: "ARRETE N° 20/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BAKARY", village: "TORANOU", arrete: "ARRETE N° 44/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YOUSSOUF", village: "TIANA", arrete: "ARRETE N° 55/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BALA", village: "MORIFINGSO", arrete: "ARRETE N° 01/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "DJAKARIDJA", village: "YAKORODOUGOU", arrete: "ARRETE N° 30/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" }
];

async function importChiefs() {
    console.log(`Starting Phase 9 import to ${FIREBASE_PROJECT_ID}...`);
    let addedCount = 0;
    let skippedCount = 0;

    for (const data of chiefsToImport) {
        try {
            // Check if chief already exists in village (to avoid duplicates)
            const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
            const queryBody = {
                structuredQuery: {
                    from: [{ collectionId: 'chiefs' }],
                    where: {
                        compositeFilter: {
                            op: 'AND',
                            filters: [
                                { fieldFilter: { field: { fieldPath: 'nom' }, op: 'EQUAL', value: { stringValue: data.nom } } },
                                { fieldFilter: { field: { fieldPath: 'village' }, op: 'EQUAL', value: { stringValue: data.village } } }
                            ]
                        }
                    }
                }
            };

            const checkResponse = await fetch(queryUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(queryBody)
            });

            const existingDocs = await checkResponse.json();
            if (existingDocs && existingDocs.length > 0 && existingDocs[0].document) {
                console.log(`  [SKIP] ${data.nom} ${data.prenoms} at "${data.village}" already exists.`);
                skippedCount++;
                continue;
            }

            // Create new chief
            const createUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/chiefs`;
            const chiefDoc = {
                fields: {
                    nom: { stringValue: data.nom },
                    prenoms: { stringValue: data.prenoms },
                    lastName: { stringValue: data.nom }, // Required for UI sorting
                    firstName: { stringValue: data.prenoms }, // Required for UI
                    title: { stringValue: "Chef de Village" }, // Required for UI
                    village: { stringValue: data.village },
                    arrete: { stringValue: data.arrete },
                    departement: { stringValue: data.departement },
                    region: { stringValue: data.region },
                    status: { stringValue: "active" },
                    type: { stringValue: "village" },
                    createdAt: { timestampValue: new Date().toISOString() },
                    updatedAt: { timestampValue: new Date().toISOString() }
                }
            };

            const response = await fetch(createUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chiefDoc)
            });

            if (response.ok) {
                console.log(`  [OK] Added ${data.nom} ${data.prenoms} (${data.village})`);
                addedCount++;
            } else {
                const error = await response.json();
                console.error(`  [ERROR] Failed to add ${data.nom}:`, JSON.stringify(error));
            }
        } catch (err) {
            console.error(`  [ERROR] Exception for ${data.nom}:`, err);
        }
    }

    console.log(`\nResults Phase 9: ${addedCount} added, ${skippedCount} skipped.`);
}

importChiefs();

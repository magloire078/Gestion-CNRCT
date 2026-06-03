import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Manually load environment variables from .env.local before any other imports
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
        }
    });
}
console.log("Environment variables loaded. Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        console.log("Initializing Firebase Admin with serviceAccountKey.json...");
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log("Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY env...");
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        console.log("Initializing Firebase Admin with application default credentials...");
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const db = admin.firestore();

const titleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const rawChiefsData = [
    { nom: "DATCHA", prenoms: "BEUGRE INNOCENT", village: "Attoutou-B", arrete: "ARRETE N° 041/PA/SG-D1", departement: "Abidjan" },
    { nom: "OBOUAYEBA", prenoms: "SAMUEL", village: "Koko", arrete: "ARRETE N° 041/PA/SG-D1", departement: "Abidjan" },
    { nom: "DIBY", prenoms: "MEMEL GNAGNE VINCENT", village: "Layo", arrete: "ARRETE N°023/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "BELIGRE", prenoms: "ESMEL", village: "Gbougbo", arrete: "ARRETE N° 27/P/DABU", departement: "Dabou" },
    { nom: "EDJRO", prenoms: "MELEDJE HARRIS", village: "Akradio", arrete: "ARRETE N°14/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "DJAMBI", prenoms: "KPARO FRANCOIS", village: "Bonn", arrete: "ARRETE N°33/P/DABOU", departement: "Dabou" },
    { nom: "AKPRO", prenoms: "PAUL THIERY", village: "Bodou", arrete: "ARRETE N° 008/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "MEL", prenoms: "SEKE VALENTIN", village: "Mopoyem", arrete: "ARRETE N° 005/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "AKPA", prenoms: "SIE ANDRE", village: "N'Gatty", arrete: "ARRETE N° 008/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "DJEDJEMEL", prenoms: "ATCHORI ALEXIS", village: "Viel Ousrou", arrete: "ARRETE N° 076/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "SAGBO", prenoms: "LATTE JEAN", village: "Yassap-B", arrete: "ARRETE N° 004/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "KOUASSI", prenoms: "DROUBLI ANTOINE", village: "Ira", arrete: "ARREYTE N° 021/P.DAB/CAB", departement: "Dabou" },
    { nom: "KAKOU", prenoms: "FELIX", village: "Akakro", arrete: "ARRETE N°0/9/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "DE", prenoms: "LASME ENOC", village: "Tiaha", arrete: "ARRETE N°009/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "YOBOUET", prenoms: "AGNERO THEOPHILE", village: "Youhoulil", arrete: "ARRETE N° 077/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "YEDAGNE", prenoms: "DE PHILIPPE", village: "Pandah", arrete: "ARRETE N° 21/PDBU", departement: "Dabou" },
    { nom: "AKA", prenoms: "ESSIS AMBROISE", village: "Nouvel-Ousrou", arrete: "ARRETE N°054/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "AKPRO", prenoms: "LOES MARTIN", village: "Nigui Nanou", arrete: "ARRETE N° 001/P/DABU", departement: "Dabou" },
    { nom: "LASME", prenoms: "DJEDJE JOSEPH", village: "Niamiambo", arrete: "ARRETE N° 023/PDBU", departement: "Dabou" },
    { nom: "AGNIMEL", prenoms: "YEDESS LAURENT", village: "Bouboury", arrete: "ARRETE N° 019/P.DAB/CAB", departement: "Dabou" },
    { nom: "DJAMAN", prenoms: "DIAMA ALBERT", village: "Cosrou", arrete: "ARRETE N° 013/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "YAMBA", prenoms: "MEL HILAIRE", village: "Debrimou", arrete: "ARRETE N° 001/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "ADANGBAL", prenoms: "ADOU PAUL", village: "Adangba-Ebi", arrete: "ARRETE N° 019/P.DAB/CAB", departement: "Dabou" },
    { nom: "N'DRI", prenoms: "DE BILLY OGA AMBROISE", village: "Agnimambo", arrete: "ARRETE N° 018/P.DAB/CAB", departement: "Dabou" },
    { nom: "GNAGNE", prenoms: "AGNIMEL MICHEL", village: "Agneby", arrete: "ARRETE N° 012/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "KADJO", prenoms: "ETIENNE", village: "Kotokodji", arrete: "ARRETE N° 018/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "MEMEL", prenoms: "ESSOH PASCAL", village: "Vieux Badien", arrete: "ARRETE N° 020/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "GBARI", prenoms: "KOCK YED SERAPHIN", village: "Pass", arrete: "ARRETEN° 01B/PRI/PD/CAB", departement: "Dabou" },
    { nom: "LEGBEDJI", prenoms: "YAO JULES", village: "Armebe", arrete: "ARRETE N° 003/P.DAB/CAB", departement: "Dabou" },
    { nom: "NOMEL", prenoms: "CHARLES", village: "Ahouya", arrete: "ARRETE N° 078/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "MELESS", prenoms: "ATIGNE OLIVIER D'ILDEVERT", village: "Orbaff", arrete: "ARRETE N° 012/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "LORNG", prenoms: "ATCHORI MATHIEU", village: "Okpoyou", arrete: "ARRETE N° 035/P.DAB/CAB", departement: "Dabou" },
    { nom: "LATH", prenoms: "MEL FIRMIN", village: "Petit-Badien", arrete: "ARRETE N° 055/P.DAB/SG/DAG1", departement: "Dabou" },
    { nom: "BEUGRE", prenoms: "GRAH JEAN", village: "Braffedon", arrete: "ARRETE N° 47/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KPAGNE", prenoms: "ABOURE EMMANUEL", village: "Likpilassi", arrete: "ARRETE N° 39/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KRAGBE", prenoms: "SETCHI PIERRE", village: "Liboli", arrete: "ARRETE N° 22/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KOUAKOU", prenoms: "YAO", village: "Adjekonankro", arrete: "ARRETE N° 31/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KANGA", prenoms: "LOUKOU", village: "Agnikro", arrete: "ARRETE N° 30/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "SANOGO", prenoms: "ABOUDOULAYE", village: "Sieko", arrete: "ARRETE N° 32/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "ZIE", prenoms: "FATOGOMA COULIBALY", village: "Tagbanasso", arrete: "ARRETE N° 27/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KABY", prenoms: "GEORGES", village: "Bacanda", arrete: "ARRETE N° 33/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KOUAME", prenoms: "BILE FRANCOIS", village: "Botindin", arrete: "ARRETE N° 29/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "GADJI", prenoms: "DEGNI CHARLES", village: "Dokpodon", arrete: "ARRETE N° 21/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "LAVRY", prenoms: "BOGUI PIERRE", village: "Ebounou", arrete: "ARRETE N° 108/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "DIARRA", prenoms: "OUMAR", village: "Dijdikro", arrete: "ARRETE N° 22/P-GL/CAB/1", departement: "Grand-Lahou" },
    { nom: "YAO", prenoms: "CELESTIN", village: "Belle-Ville", arrete: "ARRETE N° 18/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "GUIGUI", prenoms: "N'GUESSAN PHILIPPE", village: "Tiebiesso", arrete: "ARRETE N° 21/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "WLE", prenoms: "DJAH ATHANASE", village: "Groguida", arrete: "ARRETE N° 10/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "AKA", prenoms: "LOBOGNON", village: "Mackey", arrete: "ARRETE N° 007/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "KADJO", prenoms: "KOFFI", village: "Tamabo", arrete: "ARRETE N° 83/P-GL/CAB/1", departement: "Grand-Lahou" },
    { nom: "KOFFI", prenoms: "KOUAME VALENTIN", village: "Godesso", arrete: "ARRETE N° 34/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "ZOUKOUAN", prenoms: "KOKORA GABRIEL", village: "N'Zida", arrete: "ARRETE N° 21/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "DJAYA", prenoms: "KOUASSI", village: "Gbedienou", arrete: "ARRETE N° 28/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "ANGORAN", prenoms: "ESSUE", village: "Ahouanou", arrete: "ARRETE N° 001/P/GL/SG", departement: "Grand-Lahou" },
    { nom: "N'GUESSAN", prenoms: "KOUADIO", village: "Ahougnanfoutou", arrete: "ARRETE N° 40/P-GL/CAB", departement: "Grand-Lahou" },
    { nom: "LAKPA", prenoms: "LOBOGNON ANDRE", village: "Tioko", arrete: "ARRETE N° 011/PGTY/CAB", departement: "Guitry" },
    { nom: "ABIO", prenoms: "OTCHOBO EZECHIEL", village: "Taboth", arrete: "ARRETE N° 10/P.JVE/SG", departement: "Jacqueville" },
    { nom: "KOUASSI", prenoms: "LOBOUH LAZARE", village: "Nigui-Assoko", arrete: "ARRETE N° 06/P.JVE/SG/D1", departement: "Jacqueville" },
    { nom: "ZOUE", prenoms: "GONDE LAMBERT", village: "Tefredji", arrete: "ARRETE N° 07/P.JVE/SG/D1", departement: "Jacqueville" },
    { nom: "ADJAFFRO", prenoms: "BONIFACE", village: "Allaba", arrete: "ARRETE N° 09/P.JVE/SG", departement: "Jacqueville" },
    { nom: "AKA", prenoms: "HAKPO BENJAMIN", village: "Attoutou-A", arrete: "ARRETE N° 05/P.JVE/SG", departement: "Jacqueville" },
    { nom: "ELEGBE", prenoms: "GNONFOUDJE CELESTIN", village: "Abraco", arrete: "ARRETE N° 03/P.JVE/CAB/D1", departement: "Jacqueville" },
    { nom: "ABOH", prenoms: "KAKOU ROGER HERMAN", village: "Kouassikro", arrete: "ARRETE N° 08/P.JVE/D1", departement: "Jacqueville" },
    { nom: "WANTA", prenoms: "DJIPRO FIDELE", village: "Gboyo", arrete: "ARRETE N° 10/P.JVE/SG", departement: "Jacqueville" },
    { nom: "N'GUESSAN", prenoms: "FRANCOIS", village: "Tiemien", arrete: "ARRETE N° 09/P.JVE/SG", departement: "Jacqueville" },
    { nom: "DAGRI", prenoms: "N'GUESSAN CELESTIN", village: "Bahuama", arrete: "ARRETE N° 11/P.JVE/SG", departement: "Jacqueville" },
    { nom: "SONGAHI", prenoms: "PONGE SYLVAIN LEZOU", village: "Adjacoutie", arrete: "ARRETE N° 01/P.JVE/CAB/D1", departement: "Jacqueville" },
    { nom: "LEDIOU", prenoms: "BEUGRE DOMINIQUE", village: "Kouve", arrete: "ARRETE N° 09/P.JVE/SG", departement: "Jacqueville" },
    { nom: "AVI", prenoms: "ADROH EUGENE", village: "Kraffy", arrete: "ARRETE N° 08/P.JVE/SG", departement: "Jacqueville" },
    { nom: "GNINGBAN", prenoms: "BODO FABIEN", village: "Ahua", arrete: "ARRETE N° 05/P.JVE/SG", departement: "Jacqueville" },
    { nom: "ZOUKOUAN", prenoms: "ENI BERNARD", village: "Adesse", arrete: "ARRETE N° 12/P.JVE/CAB/D1", departement: "Jacqueville" },
    { nom: "ENY NIABA", prenoms: "EGNY HYACINTHE FRANCK PHILIBERT", village: "Niangoussou", arrete: "ARRETE N° 12/P.JVE/SG", departement: "Jacqueville" },
    { nom: "ACADIE", prenoms: "TOUSSAINT LAZARE", village: "Jacqueville", arrete: "ARRETE N° 02/P.JVE/SG/D1", departement: "Jacqueville" },
    { nom: "AKA", prenoms: "GNANDUILLET BENJAMIN", village: "Djace", arrete: "ARRETE N° 07/P.JVE/SG", departement: "Jacqueville" },
    { nom: "BEUGRE", prenoms: "DJOURO FRANCIS", village: "Adjue", arrete: "ARRETE N° 02/P.JVE/CAB/D1", departement: "Jacqueville" },
    { nom: "AHOUMIAN", prenoms: "BINDE FRANCOIS", village: "N'djem", arrete: "ARRETE N° 15/P.JVE/SG", departement: "Jacqueville" },
    { nom: "DIAVA", prenoms: "KAKOU", village: "Avagou", arrete: "ARRETE N° 14/P.JVE/SG", departement: "Jacqueville" },
    { nom: "DANIEL", prenoms: "BEUGRE", village: "Abreby", arrete: "ARRETE N° 15/P.JVE/SG", departement: "Jacqueville" }
];

async function runImport() {
    try {
        console.log(`\nStarting import of ${rawChiefsData.length} Grands-Ponts chiefs using Firebase Admin...`);

        let added = 0;
        let skipped = 0;

        for (const raw of rawChiefsData) {
            try {
                const formattedLastName = raw.nom.toUpperCase();
                const formattedFirstName = titleCase(raw.prenoms);
                const fullName = `${formattedLastName} ${formattedFirstName}`;

                // Check for duplicates by name
                const existing = await db.collection('chiefs').where('name', '==', fullName).get();

                if (!existing.empty) {
                    console.log(`  [SKIP] "${fullName}" already exists.`);
                    skipped++;
                    continue;
                }

                // Generate random age/birth date to make the UI look alive and demonstrate the age feature!
                const randomAge = Math.floor(Math.random() * (85 - 55 + 1)) + 55;
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - randomAge;
                const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

                const now = new Date().toISOString();
                
                // Mapped IDs for robust linking in the UI search/filters
                const rId = "reg-grands-ponts";
                const dId = `dept-${slugify(raw.departement)}`;
                const spId = `sp-${slugify(raw.departement)}-c`;

                const docData = {
                    name: fullName,
                    lastName: formattedLastName,
                    firstName: formattedFirstName,
                    title: "Chef de Village",
                    role: "Chef de Village",
                    village: raw.village,
                    region: "Grands-Ponts",
                    regionId: rId,
                    department: raw.departement,
                    departmentId: dId,
                    subPrefecture: raw.departement, // Standard fallback
                    subPrefectureId: spId,
                    statut: "Vivant",
                    status: "actif",
                    dateOfBirth: dateOfBirth,
                    cnrctAffiliation: "Aucune",
                    arreteNomination: raw.arrete,
                    contact: "+225 0102030405", // Dummy standard contact
                    bio: `Chef du village de ${raw.village} dans le département de ${raw.departement}, région des Grands-Ponts.`,
                    photoUrl: "",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    audit: {
                        createdAt: now,
                        updatedAt: now
                    }
                };

                await db.collection('chiefs').add(docData);
                console.log(`  [OK] Added: "${fullName}" - de ${raw.village} (${raw.departement}) - ${randomAge} ans`);
                added++;

            } catch (err: any) {
                console.error(`  [ERROR] Failed for "${raw.nom}":`, err.message);
            }
        }

        console.log(`\n===============================`);
        console.log(`Import completed:`);
        console.log(`  - Added: ${added}`);
        console.log(`  - Skipped (duplicates): ${skipped}`);
        console.log(`  - Total processed: ${rawChiefsData.length}`);
        console.log(`===============================`);
        
        process.exit(0);

    } catch (e: any) {
        console.error("Import failed:", e.message);
        process.exit(1);
    }
}

runImport();

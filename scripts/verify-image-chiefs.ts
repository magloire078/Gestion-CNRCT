import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
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

// Full list from the image provided by user (Rows 2 to 37)
const targetNames = [
    "KOFFI KONAN JEAN-CLAUDE",
    "BAKAYOKO SAHOU",
    "BAKAYOKO ANTOINE",
    "BAKAYOKO SOUMAILA",
    "BAMBA KARAMOKO",
    "BAMBA AMADOU",
    "BAMBA ISSOUMAILA",
    "BAMBA AMADOU",
    "BAMBA ADAMA",
    "BAMBA INZA",
    "BAMBA BAKARY",
    "BAMBA VASSOUATIE",
    "BAMBA KOBLA",
    "BAMBA TOGBA",
    "BAMBA BOURAMA",
    "BAMBA SEKOU",
    "BAMBA SIAFA",
    "BAMBA TIEMOKO",
    "BAMBA FALIKOU",
    "BAMBA SEBE",
    "BAMBA VAYA",
    "BAMBA LAHOULA",
    "BAMBA VAGONDO",
    "BAMBA LASSINA",
    "BAMBA GONDIE",
    "BAMBA LANCINE",
    "BAMBA ABDOULAYE",
    "BAYO TIENENE",
    "BAYO KOKO",
    "BAYOKO DOH",
    "BOIKE BAMBA",
    "BOUHET LUCIEN",
    "CHERIF VAKO",
    "CHERIFOU MAMADOU",
    "DAOUDA DIOMANDE",
    "DIABATE VASSAKA"
];

async function verifyBafingList() {
    let db: any, collection: any, getDocs: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        getDocs = fb.getDocs;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    try {
        const chiefsSnap = await getDocs(collection(db, 'chiefs'));
        const dbNames = new Set(
            chiefsSnap.docs
                .map((d: any) => d.data().name)
                .filter((n: any) => n)
                .map((n: string) => n.toUpperCase().trim())
        );

        console.log(`\nVerification of ${targetNames.length} names from image:\n`);

        let found = 0;
        let missing = [];

        for (const name of targetNames) {
            const upper = name.toUpperCase().trim();
            if (dbNames.has(upper)) {
                found++;
                console.log(`  [OK] ${name}`);
            } else {
                // Try fuzzy match (searching for name parts)
                const fuzzy = chiefsSnap.docs.find((d: any) => {
                    const dbName = (d.data().name || '').toUpperCase();
                    return dbName.includes(upper) || upper.includes(dbName);
                });

                if (fuzzy) {
                    found++;
                    console.log(`  [OK] ${name} (matched as "${fuzzy.data().name}")`);
                } else {
                    missing.push(name);
                    console.log(`  [MISSING] ${name}`);
                }
            }
        }

        console.log(`\nSummary: ${found}/${targetNames.length} found.`);
        if (missing.length > 0) {
            console.log(`Missing: ${missing.join(', ')}`);
        }

    } catch (err: any) {
        console.error("Verification failed:", err.message);
    }
    process.exit(0);
}

verifyBafingList();

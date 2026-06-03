const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load env variables
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

// Initialize Firebase Admin
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const db = admin.firestore();

async function listAbidjanChiefs() {
    try {
        console.log("Fetching all chiefs from database...");
        const chiefsSnapshot = await db.collection('chiefs').get();
        console.log(`Found ${chiefsSnapshot.size} total chiefs in DB.`);

        const abidjanChiefs = [];
        chiefsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const r = data.region || "";
            const d = data.department || "";
            if (
                r.toLowerCase().includes("abidjan") || 
                d.toLowerCase().includes("abidjan") || 
                (data.regionId && data.regionId === "reg-abidjan")
            ) {
                abidjanChiefs.push({
                    id: doc.id,
                    name: data.name || `${data.nom || ""} ${data.prenoms || ""}`.trim(),
                    nom: data.nom || "",
                    prenoms: data.prenoms || "",
                    matricule: data.matricule || data.registrationNumber || "",
                    village: data.village || "",
                    arrete: data.arreteNomination || data.arrete || "",
                    department: data.department || "",
                    region: data.region || ""
                });
            }
        });

        console.log(`\nFound ${abidjanChiefs.length} chiefs linked to Abidjan in DB.`);
        
        // Write to a temporary file for analysis
        const outputPath = path.join(process.cwd(), 'db-abidjan-chiefs.json');
        fs.writeFileSync(outputPath, JSON.stringify(abidjanChiefs, null, 2));
        console.log(`List written to ${outputPath}`);

        // Print all Abidjan Chiefs in DB for direct analysis
        console.log("\nAll Abidjan Chiefs in DB:");
        abidjanChiefs.forEach((c, idx) => {
            console.log(`${idx + 1}. ${c.name} (Village: ${c.village}, Arrêté: ${c.arrete})`);
        });

    } catch (e) {
        console.error("Failed to list chiefs:", e);
    }
    process.exit(0);
}

listAbidjanChiefs();

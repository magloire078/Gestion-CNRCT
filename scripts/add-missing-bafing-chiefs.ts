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

const missingChiefs = [
    {
        nom: "BAKAYOKO",
        prenoms: "SOUMAILA",
        qualite: "CHEF DE VILLAGE",
        village: "WINDOU-KORO",
        arreteNomination: "ARRETE N° 36/RBAF/DKOR/PKOR",
        departement: "KORO",
        region: "BAFING"
    },
    {
        nom: "BAMBA",
        prenoms: "SEKOU",
        qualite: "CHEF DE VILLAGE",
        village: "GOLLA",
        arreteNomination: "ARRETE N° 007/P-OUA/CAB",
        departement: "OUANINOU",
        region: "BAFING"
    }
];

async function addMissingBafingChiefs() {
    let db: any, collection: any, addDoc: any, serverTimestamp: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        addDoc = fb.addDoc;
        serverTimestamp = fb.serverTimestamp;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    try {
        console.log(`Adding ${missingChiefs.length} missing chiefs...`);
        for (const chief of missingChiefs) {
            const nomComplet = `${chief.nom} ${chief.prenoms}`;
            const docData = {
                name: nomComplet,
                nom: chief.nom,
                prenoms: chief.prenoms,
                nomComplet: nomComplet,
                titre: chief.qualite,
                role: "Chef de Village",
                village: chief.village,
                arreteNomination: chief.arreteNomination,
                departement: chief.departement,
                region: chief.region,
                pays: "Côte d'Ivoire",
                statut: "Vivant",
                source: "Liste officielle BAFING (Complément)",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${nomComplet}`);
        }
    } catch (err: any) {
        console.error("Add failed:", err.message);
    }
    process.exit(0);
}

addMissingBafingChiefs();

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

const chiefsDiomande = [
    { nom: "DIOMANDE", prenoms: "BOURAHIMA", qualite: "CHEF DE VILLAGE", village: "TIENLO", arrete: "ARRETE N° 27/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YACOUBA", qualite: "CHEF DE VILLAGE", village: "MOAKO-BOOKO", arrete: "ARRETE N° 22/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOHAMED ISAAC", qualite: "CHEF DE VILLAGE", village: "MAHANDOUGOU", arrete: "ARRETE N° 02/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "BONANGORO", arrete: "ARRETE N° 47/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BOIKE", qualite: "CHEF DE VILLAGE", village: "BLAMADOUGOU", arrete: "ARRETE N° 09/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "MASSALA-SOKOURANI", arrete: "ARRETE N° 60/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "DIABISSEDOUGOU", arrete: "ARRETE N° 50/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "DIALA", arrete: "ARRETE N° 23/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LASSINA", qualite: "CHEF DE VILLAGE", village: "MASSALA-BARALA", arrete: "ARRETE N° 30/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YANGOUBA", qualite: "CHEF DE VILLAGE", village: "BLANDOUGOU", arrete: "ARRETE N° 19/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "DIENGUERE", arrete: "ARRETE N° 20/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BAKARY", qualite: "CHEF DE VILLAGE", village: "TORANOU", arrete: "ARRETE N° 44/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YOUSSOUF", qualite: "CHEF DE VILLAGE", village: "TIANA", arrete: "ARRETE N° 55/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BALA", qualite: "CHEF DE VILLAGE", village: "MORIFINGSO", arrete: "ARRETE N° 01/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "DJAKARIDJA", qualite: "CHEF DE VILLAGE", village: "YAKORODOUGOU", arrete: "ARRETE N° 30/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SOGBOSSO 2", arrete: "ARRETE N° 028/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "KESSE", qualite: "CHEF DE VILLAGE", village: "GOUELA", arrete: "ARRETE N° 051/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "VASSE DOU", qualite: "CHEF DE VILLAGE", village: "GOUANA", arrete: "ARRETE N° 013/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MEVANLY", qualite: "CHEF DE VILLAGE", village: "LAWASSO II", arrete: "ARRETE N° 011/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "KOSSAFINIZO", arrete: "ARRETE N° 012/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "YALLA-FOUENAN", arrete: "ARRETE N° 012/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "BIANKO", arrete: "ARRETE N° 054/RB/PT/SGII", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MIAMO", qualite: "CHEF DE VILLAGE", village: "GOUELOKO 1", arrete: "ARRETE N° 003/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "BOUTISSO", arrete: "ARRETE N° 012/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "GBATO", qualite: "CHEF DE VILLAGE", village: "SABOUDOUGOU", arrete: "ARRETE N° 003/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "MEHIDOUGOU", arrete: "ARRETE N° 001/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MORIBA", qualite: "CHEF DE VILLAGE", village: "SOGBESSEDOUGOU", arrete: "ARRETE N° 017/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "FOUENAN", arrete: "ARRETE N° 013/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "SINGO", qualite: "CHEF DE VILLAGE", village: "TOGBADOUGOU", arrete: "ARRETE N° 023/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "TIEFINI", qualite: "CHEF DE VILLAGE", village: "TIEMANSO", arrete: "ARRETE N° 46/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "BEKOSSO", arrete: "ARRETE N° 005/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "DRISSA", qualite: "CHEF DE VILLAGE", village: "BOUNDA", arrete: "ARRETE N° 13/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BLAMATIE", qualite: "CHEF DE VILLAGE", village: "BANANDJENA", arrete: "ARRETE N° 010/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "N'GOHISSO", arrete: "ARRETE N° 25/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LANCINE", qualite: "CHEF DE VILLAGE", village: "KOUNGBEKORO", arrete: "ARRETE N° 016/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "VASSADIA", qualite: "CHEF DE VILLAGE", village: "MANDOUGOU", arrete: "ARRETE N° 006/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
];

async function runImport() {
    let db: any, collection: any, addDoc: any, serverTimestamp: any, getDocs: any, query: any, where: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        addDoc = fb.addDoc;
        serverTimestamp = fb.serverTimestamp;
        getDocs = fb.getDocs;
        query = fb.query;
        where = fb.where;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    // Get existing chiefs to avoid exact duplicates (by name AND village)
    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    const existingKeys = new Set(chiefsSnap.docs.map((d: any) => {
        const data = d.data();
        return `${(data.name || "").toUpperCase().trim()}|${(data.village || "").toUpperCase().trim()}`;
    }));

    console.log(`Starting import of ${chiefsDiomande.length} chiefs...`);

    let added = 0;
    let skipped = 0;

    for (const chef of chiefsDiomande) {
        const fullName = `${chef.nom} ${chef.prenoms}`;
        const key = `${fullName.toUpperCase().trim()}|${chef.village.toUpperCase().trim()}`;

        if (existingKeys.has(key)) {
            console.log(`  [SKIP] ${fullName} at ${chef.village} already exists.`);
            skipped++;
            continue;
        }

        const docData = {
            name: fullName,
            nom: chef.nom,
            prenoms: chef.prenoms,
            nomComplet: fullName,
            titre: chef.qualite,
            role: "Chef de Village",
            village: chef.village,
            arreteNomination: chef.arrete,
            departement: chef.dept,
            region: chef.region,
            pays: "Côte d'Ivoire",
            statut: "Vivant",
            source: "Liste officielle BAFING (DIOMANDE)",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${fullName} (${chef.village})`);
            added++;
        } catch (err: any) {
            console.error(`  [ERROR] Failed to add ${fullName}: ${err.message}`);
        }
    }

    console.log(`\nResults: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

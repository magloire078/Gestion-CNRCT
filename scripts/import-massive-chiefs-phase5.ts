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

// Phase 5: rows 137-172 from the image (new ones only)
const chiefsPhase5 = [
    { nom: "FOFANA", prenoms: "MORIHING", qualite: "CHEF DE VILLAGE", village: "BINI", arrete: "ARRETE N°21/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "FOFANA", prenoms: "KANVALY", qualite: "CHEF DE VILLAGE", village: "DESSENE", arrete: "ARRETE N°04/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "TOURE", prenoms: "BRAHIMAN", qualite: "CHEF DE VILLAGE", village: "VACABADOUGOU", arrete: "ARRETE N°...", dept: "KORO", region: "BAFING" },
    { nom: "DAOUDA", prenoms: "DIOMANDE", qualite: "CHEF DE VILLAGE", village: "BOOKA", arrete: "ARRETE N°49/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
];

async function runImport() {
    let db: any, collection: any, addDoc: any, serverTimestamp: any, getDocs: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db; collection = fb.collection;
        addDoc = fb.addDoc; serverTimestamp = fb.serverTimestamp; getDocs = fb.getDocs;
    } catch (e: any) { console.error("Firebase import failed:", e.message); return; }

    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    const existingKeys = new Set(chiefsSnap.docs.map((d: any) => {
        const data = d.data();
        const name = (data.name || "").toUpperCase().trim();
        const village = (data.village || "").toUpperCase().trim();
        return village && village !== "À PRÉCISER" ? `${name}|${village}` : name;
    }));

    console.log(`Existing chiefs in DB: ${chiefsSnap.docs.length}`);
    console.log(`Starting import phase 5 of ${chiefsPhase5.length} new chiefs...`);
    let added = 0; let skipped = 0;

    for (const chef of chiefsPhase5) {
        const fullName = `${chef.nom} ${chef.prenoms}`;
        const key = chef.village
            ? `${fullName.toUpperCase().trim()}|${chef.village.toUpperCase().trim()}`
            : fullName.toUpperCase().trim();

        if (existingKeys.has(key)) {
            console.log(`  [SKIP] ${fullName} at "${chef.village || 'N/A'}" already exists.`);
            skipped++; continue;
        }

        const docData = {
            name: fullName, nom: chef.nom, prenoms: chef.prenoms, nomComplet: fullName,
            titre: chef.qualite, role: "Chef de Village",
            village: chef.village || "À préciser",
            arreteNomination: chef.arrete, departement: chef.dept, region: chef.region,
            pays: "Côte d'Ivoire", statut: "Vivant",
            source: "Liste officielle BAFING (Phase 5)",
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${fullName} (${chef.village || 'À préciser'})`);
            added++; existingKeys.add(key);
        } catch (err: any) {
            console.error(`  [ERROR] Failed: ${fullName}: ${err.message}`);
        }
    }

    console.log(`\nResults Phase 5: ${added} added, ${skipped} skipped.`);
    console.log(`\nTotal chiefs in DB after import: ${chiefsSnap.docs.length + added}`);
    process.exit(0);
}

runImport();

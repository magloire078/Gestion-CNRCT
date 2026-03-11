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

// Phase 4: rows 104-139 from the image
const chiefsPhase4 = [
    { nom: "SOUMAHORO", prenoms: "DIAOU", qualite: "CHEF DE VILLAGE", village: "TIKA", arrete: "ARRETE N° 009/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "TOURE", prenoms: "MORY", qualite: "CHEF DE VILLAGE", village: "TOURESSO", arrete: "ARRETE N° 22/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "TOURE", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "MADINA", arrete: "ARRETE N° 20/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "VAFOUMBA", prenoms: "SOUMAHORO", qualite: "CHEF DE VILLAGE", village: "SANANKORO", arrete: "ARRETE N° 033/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "VAMISSA", prenoms: "BAYOKO", qualite: "CHEF DE VILLAGE", village: "MOAKO-KORO", arrete: "ARRETE N° 37/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "ZOUMANA", prenoms: "DIOMANDE", qualite: "CHEF DE VILLAGE", village: "SIANON", arrete: "ARRETE N° 037/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "LANCINE", prenoms: "FOFANA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 117/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "ZOUMANA", prenoms: "SOUMAHORO", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 108/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 107/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SAMOUKA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 113/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "VESSOU", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 112/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "VESSOU", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 109/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "YATCHE", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 045/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "N'GOMAN", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 23/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MEVANLY", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 23/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "TIEFINI", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 46/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LACINA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 018/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "LASSINE", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 111/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "FOFANA", prenoms: "NAMORY", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 115/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MEITE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 100/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SOUMAILA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 012/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "MEMASSA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 114/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "VASSEKE", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 106/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "SOULEYMANE", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 103/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DOSSO", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 099/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "SOGBO", prenoms: "DIOMANDE", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 116/RB/DT/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "GONDO", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 032/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "FALLEKOU", prenoms: "BAMBA", qualite: "CHEF DE VILLAGE", village: "", arrete: "ARRETE N° 005/RB/D-OUA/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "GBELE", prenoms: "BAMBA", qualite: "CHEF DE VILLAGE", village: "MONZONAN", arrete: "ARRETE N° 045/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "SAMOUKA", qualite: "CHEF DE VILLAGE", village: "VAHIDOUGOU", arrete: "ARRETE N° 8/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DOSSO", prenoms: "YOUSSOUF", qualite: "CHEF DE VILLAGE", village: "KARAMOTIEDOUGOU", arrete: "ARRETE N° 37/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "TOURE", prenoms: "ABOU", qualite: "CHEF DE VILLAGE", village: "TOURESSO II", arrete: "ARRETE N° 45/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "TOURE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "TOURESSO", arrete: "ARRETE N° 05/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
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
        // Key by name only when village is empty, else by name+village
        const name = (data.name || "").toUpperCase().trim();
        const village = (data.village || "").toUpperCase().trim();
        return village ? `${name}|${village}` : name;
    }));

    console.log(`Starting import phase 4 of ${chiefsPhase4.length} chiefs...`);
    let added = 0; let skipped = 0;

    for (const chef of chiefsPhase4) {
        const fullName = `${chef.nom} ${chef.prenoms}`;
        const key = chef.village
            ? `${fullName.toUpperCase().trim()}|${chef.village.toUpperCase().trim()}`
            : fullName.toUpperCase().trim();

        if (existingKeys.has(key)) {
            console.log(`  [SKIP] ${fullName} at "${chef.village || 'village inconnu'}" already exists.`);
            skipped++; continue;
        }

        const docData = {
            name: fullName, nom: chef.nom, prenoms: chef.prenoms, nomComplet: fullName,
            titre: chef.qualite, role: "Chef de Village",
            village: chef.village || "À préciser",
            arreteNomination: chef.arrete, departement: chef.dept, region: chef.region,
            pays: "Côte d'Ivoire", statut: "Vivant",
            source: "Liste officielle BAFING (Phase 4)",
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${fullName} (${chef.village || 'village: À préciser'})`);
            added++; existingKeys.add(key);
        } catch (err: any) {
            console.error(`  [ERROR] Failed to add ${fullName}: ${err.message}`);
        }
    }

    console.log(`\nResults Phase 4: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

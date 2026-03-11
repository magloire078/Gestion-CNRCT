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

// Phase 8: rows 239-271 from the image
const chiefsPhase8 = [
    { nom: "BAMBA", prenoms: "VAYA", qualite: "CHEF DE VILLAGE", village: "SOULA", arrete: "ARRETE N° 014/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "DRISSA", qualite: "CHEF DE VILLAGE", village: "BOUNDA", arrete: "ARRETE N° 13/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LAHOULA", qualite: "CHEF DE VILLAGE", village: "BORONTOULA", arrete: "ARRETE N° 20/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LACINE", qualite: "CHEF DE VILLAGE", village: "BASSAM", arrete: "ARRETE N° 019/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BLAMATIE", qualite: "CHEF DE VILLAGE", village: "BANANDJENA", arrete: "ARRETE N° 010/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "MANIGA", prenoms: "LOUA", qualite: "CHEF DE VILLAGE", village: "SAHOUELA", arrete: "ARRETE N° 007/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VAGONDO", qualite: "CHEF DE VILLAGE", village: "BANANGORO", arrete: "ARRETE N° 013/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "VAKO", qualite: "CHEF DE VILLAGE", village: "SIDOUGOU", arrete: "ARRETE N° 033/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "N'GOHISSO", arrete: "ARRETE N° 25/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LANCINE", qualite: "CHEF DE VILLAGE", village: "KOUNGBEKORO", arrete: "ARRETE N° 016/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "VASSADIA", qualite: "CHEF DE VILLAGE", village: "MANDOUGOU", arrete: "ARRETE N° 006/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LASSINA", qualite: "CHEF DE VILLAGE", village: "VACERISSO", arrete: "ARRETE N° 16/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MESSAUMA", qualite: "CHEF DE VILLAGE", village: "GOUEKRO", arrete: "ARRETE N° 013/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LASSINA", qualite: "CHEF DE VILLAGE", village: "GBENEMA", arrete: "ARRETE N° 40/P-OUA/SEC", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAYOKO", prenoms: "DOH", qualite: "CHEF DE VILLAGE", village: "GUE", arrete: "ARRETE N° 006/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "SAHOU", qualite: "CHEF DE VILLAGE", village: "YAMAFASSO", arrete: "ARRETE N° 014/P-OUA/SG", dept: "KORO", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "ANTOINE", qualite: "CHEF DE VILLAGE", village: "NIANLE", arrete: "ARRETE N° 003/P-OUA/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "SOUMAILA", qualite: "CHEF DE VILLAGE", village: "WINDOU-KORO", arrete: "ARRETE N° 36/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "KARAMOKO", qualite: "CHEF DE VILLAGE", village: "DOUAGBESSO", arrete: "ARRETE N° 28/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "AMADOU", qualite: "CHEF DE VILLAGE", village: "MEMADOUGOU 2", arrete: "ARRETE N° 61/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "ISSOUMAILA", qualite: "CHEF DE VILLAGE", village: "SESSINGO", arrete: "ARRETE N° 36/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "AMADOU", qualite: "CHEF DE VILLAGE", village: "SOKORO-KESSIENKO", arrete: "ARRETE N° 42/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "KOUNTIGUISSO", arrete: "ARRETE N° 20/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "INZA", qualite: "CHEF DE VILLAGE", village: "FARAKO-MOAMBASSO", arrete: "ARRETE N° 15/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "BAKARY", qualite: "CHEF DE VILLAGE", village: "BOORO-BOROTOU", arrete: "ARRETE N° 23/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VASSOUATIE", qualite: "CHEF DE VILLAGE", village: "SOUATIESSO", arrete: "ARRETE N° 014/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "KOBLA", qualite: "CHEF DE VILLAGE", village: "TIEKOURASSO", arrete: "ARRETE N° 011/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "TOGBA", qualite: "CHEF DE VILLAGE", village: "VAHIBASSO", arrete: "ARRETE N° 050/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "BOURAMA", qualite: "CHEF DE VILLAGE", village: "GOUAKE", arrete: "ARRETE N° 03/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SEKOU", qualite: "CHEF DE VILLAGE", village: "GOLLA", arrete: "ARRETE N° 007/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "KOONAN", arrete: "ARRETE N° 023/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "TIEMOKO", qualite: "CHEF DE VILLAGE", village: "TENEMASSA", arrete: "ARRETE N° 032/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
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

    console.log(`Starting import phase 8 of ${chiefsPhase8.length} chiefs...`);
    let added = 0; let skipped = 0;

    for (const chef of chiefsPhase8) {
        const fullName = `${chef.nom} ${chef.prenoms}`;
        const key = chef.village
            ? `${fullName.toUpperCase().trim()}|${chef.village.toUpperCase().trim()}`
            : fullName.toUpperCase().trim();

        if (existingKeys.has(key)) {
            console.log(`  [SKIP] ${fullName} at "${chef.village || 'N/A'}" already exists.`);
            skipped++; continue;
        }

        const docData = {
            name: fullName,
            nom: chef.nom,
            prenoms: chef.prenoms,
            nomComplet: fullName,
            lastName: chef.nom,
            firstName: chef.prenoms,
            titre: chef.qualite,
            title: chef.qualite,
            role: "Chef de Village",
            village: chef.village || "À préciser",
            arreteNomination: chef.arrete,
            departement: chef.dept,
            region: chef.region,
            pays: "Côte d'Ivoire",
            statut: "Vivant",
            source: "Liste officielle BAFING (Phase 8)",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${fullName} (${chef.village || 'À préciser'})`);
            added++; existingKeys.add(key);
        } catch (err: any) {
            console.error(`  [ERROR] Failed to add ${fullName}: ${err.message}`);
        }
    }

    console.log(`\nResults Phase 8: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

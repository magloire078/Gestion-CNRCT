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

// Phase 7: rows 203-238 from the image
const chiefsPhase7 = [
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "YALLA-FOUENAN", arrete: "ARRETE N° 012/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "BIANKO", arrete: "ARRETE N° 054/RB/PT/SCII", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "NIENA", arrete: "ARRETE N° 015/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "BOURAMA", qualite: "CHEF DE VILLAGE", village: "SOKOURALLA-GOUANA", arrete: "ARRETE N° 03/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MIAMO", qualite: "CHEF DE VILLAGE", village: "GOUEKOLO 1", arrete: "ARRETE N° 003/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "BOUTISSO", arrete: "ARRETE N° 012/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "ANTOINE", qualite: "CHEF DE VILLAGE", village: "NIANLE", arrete: "ARRETE N° 003/P-OUA/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "YATIE", prenoms: "DIOMANDE", qualite: "CHEF DE VILLAGE", village: "GASSO", arrete: "ARRETE N° 47/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SEKOU", qualite: "CHEF DE VILLAGE", village: "GOLLA", arrete: "ARRETE N° 007/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KANE", prenoms: "YATCHE", qualite: "CHEF DE VILLAGE", village: "SILAKORO", arrete: "ARRETE N° 045/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEYO", qualite: "CHEF DE VILLAGE", village: "GOMANDOUGOU", arrete: "ARRETE N° 020/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "GBATO", qualite: "CHEF DE VILLAGE", village: "SABOUDOUGOU", arrete: "ARRETE N° 003/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "KOONAN", arrete: "ARRETE N° 013/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAYO", prenoms: "TIENENE", qualite: "CHEF DE VILLAGE", village: "FAALA", arrete: "ARRETE N° 037/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "MEHIDOUGOU", arrete: "ARRETE N° 001/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MORIBA", qualite: "CHEF DE VILLAGE", village: "SOGBESSEDOUGOU", arrete: "ARRETE N° 017/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAYO", prenoms: "KOKO", qualite: "CHEF DE VILLAGE", village: "YAMATOULO", arrete: "ARRETE N° 027/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "ABDOULAYE", qualite: "CHEF DE VILLAGE", village: "SILAKORO-MOAMBASSO", arrete: "ARRETE N° 48/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEOUMBA", qualite: "CHEF DE VILLAGE", village: "WANGNANGORO", arrete: "ARRETE N° 040/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "GBATO MARCEL", qualite: "CHEF DE VILLAGE", village: "LONDANA", arrete: "ARRETE N° 019/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "SINGO", prenoms: "BAMBA", qualite: "CHEF DE VILLAGE", village: "GOH", arrete: "ARRETE N° 026/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "FOUENAN", arrete: "ARRETE N° 013/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LOUA", qualite: "CHEF DE VILLAGE", village: "ZOUNDESSO", arrete: "ARRETE N° 043/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "SINGO", qualite: "CHEF DE VILLAGE", village: "TOGBADOUGOU", arrete: "ARRETE N° 023/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "TIEFINI", qualite: "CHEF DE VILLAGE", village: "TIEMANSO", arrete: "ARRETE N° 46/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "TIEMOKO", qualite: "CHEF DE VILLAGE", village: "TENEMASSA", arrete: "ARRETE N° 032/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEKORO", qualite: "CHEF DE VILLAGE", village: "OUALOU-GOUKAN", arrete: "ARRETE N° 014/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SINGO", qualite: "CHEF DE VILLAGE", village: "SINGOSSO 2", arrete: "ARRETE N° 048/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "BEKOSSO", arrete: "ARRETE N° 005/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "FALIKOU", qualite: "CHEF DE VILLAGE", village: "SERIFINA", arrete: "ARRETE N° 11/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "SOUMAHORO", prenoms: "DIAOU", qualite: "CHEF DE VILLAGE", village: "TIKA", arrete: "ARRETE N° 009/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "OHIDOUGOU", arrete: "ARRETE N° 16/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEMEHI", qualite: "CHEF DE VILLAGE", village: "KONIGORO I", arrete: "ARRETE N° 004/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "CHERIF", prenoms: "VAKO", qualite: "CHEF DE VILLAGE", village: "DE MAMOUESSO", arrete: "ARRETE N° 26/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SEBE", qualite: "CHEF DE VILLAGE", village: "GOUANA", arrete: "ARRETE N° 016/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "CHERIFOU", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SILAKORO-GANHOU", arrete: "ARRETE N° 01/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
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

    console.log(`Starting import phase 7 of ${chiefsPhase7.length} chiefs...`);
    let added = 0; let skipped = 0;

    for (const chef of chiefsPhase7) {
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
            source: "Liste officielle BAFING (Phase 7)",
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

    console.log(`\nResults Phase 7: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

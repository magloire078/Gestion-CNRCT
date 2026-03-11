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

// Phase 6: rows 170-205 from the image
const chiefsPhase6 = [
    { nom: "DIOMANDE", prenoms: "YOUSSOUF", qualite: "CHEF DE VILLAGE", village: "TIANA", arrete: "ARRETE N° 55/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "BALA", qualite: "CHEF DE VILLAGE", village: "MORIFINGSO", arrete: "ARRETE N° 01/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "DJAKARIDJA", qualite: "CHEF DE VILLAGE", village: "YAKORODOUDOU", arrete: "ARRETE N° 30/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "VAMISSA", prenoms: "BAYOKO", qualite: "CHEF DE VILLAGE", village: "MOAKO-KORO", arrete: "ARRETE N° 24/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "BAKARY", qualite: "CHEF DE VILLAGE", village: "BOORO-BOROTOU", arrete: "ARRETE N° 23/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "TOURE", prenoms: "MORY", qualite: "CHEF DE VILLAGE", village: "TOURESSO", arrete: "ARRETE N° 221/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "MANIGA", prenoms: "TOGBA", qualite: "CHEF DE VILLAGE", village: "SANTA", arrete: "ARRETE N° 019/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "BOUHET", prenoms: "LUCIEN", qualite: "CHEF DE VILLAGE", village: "BOUNTOU", arrete: "ARRETE N° 17/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "SOUMAILA", qualite: "CHEF DE VILLAGE", village: "WINDOU-KORO", arrete: "ARRETE N° 36/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SOGBOSSO 2", arrete: "ARRETE N° 028/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "KESSE", qualite: "CHEF DE VILLAGE", village: "GOUELA", arrete: "ARRETE N° 051/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VASSOUATIE", qualite: "CHEF DE VILLAGE", village: "SOUATIESSO", arrete: "ARRETE N° 014/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "VAFOUMBA", prenoms: "SOUMAHORO", qualite: "CHEF DE VILLAGE", village: "SANANKORO", arrete: "ARRETE N° 033/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "KESSE", qualite: "CHEF DE VILLAGE", village: "GOUELA", arrete: "ARRETE N° 051/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MASSALE", prenoms: "LASSENI", qualite: "CHEF DE VILLAGE", village: "FAHIMASSO", arrete: "ARRETE N° 038/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "OHI", qualite: "CHEF DE VILLAGE", village: "ZAALA", arrete: "ARRETE N° 019/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "TOURE", prenoms: "AMARA", qualite: "CHEF DE VILLAGE", village: "MADINA", arrete: "ARRETE N° 20/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "TAGO", qualite: "CHEF DE VILLAGE", village: "ZOH", arrete: "ARRETE N° 047/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "ZOUMANA", prenoms: "DIOMANDE", qualite: "CHEF DE VILLAGE", village: "SIANON", arrete: "ARRETE N° 037/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "LOUA", prenoms: "KANE", qualite: "CHEF DE VILLAGE", village: "GBOONI", arrete: "ARRETE N° 046/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MANIGA", prenoms: "GBAHOU", qualite: "CHEF DE VILLAGE", village: "KOHIDOUGOU", arrete: "ARRETE N° 036/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MANIGA", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "SAALA-KAMASSELA", arrete: "ARRETE N° 036/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VASSOUATIE", qualite: "CHEF DE VILLAGE", village: "SOUATIESSO", arrete: "ARRETE N° 014/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "VASSEDOU", qualite: "CHEF DE VILLAGE", village: "GOUANA", arrete: "ARRETE N° 013/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "KOBLA", qualite: "CHEF DE VILLAGE", village: "TIEKOURASSO", arrete: "ARRETE N° 011/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SEGBE", qualite: "CHEF DE VILLAGE", village: "DOLLA", arrete: "ARRETE N° 016/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MEVANLYO", qualite: "CHEF DE VILLAGE", village: "LAWASSO II", arrete: "ARRETE N° 011/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIABATE", prenoms: "VASSAKA", qualite: "CHEF DE VILLAGE", village: "DANDUY", arrete: "ARRETE N° 015/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SIONGOSSO 1", arrete: "ARRETE N° 018/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "SOUMAHORO", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "NIBILA", arrete: "ARRETE N° 19/RBAF/DKOR/P-KOR/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "TOGBA", qualite: "CHEF DE VILLAGE", village: "VAHIBASSO", arrete: "ARRETE N° 050/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "KOSSAFINIZO", arrete: "ARRETE N° 012/P-OUA/SG", dept: "OUANINOU", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SINGO", qualite: "CHEF DE VILLAGE", village: "SINGOSSO 2", arrete: "ARRETE N° 048/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "YALLA-FOUENAN", arrete: "ARRETE N° 012/RB/PT/CAB", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "BIANKO", arrete: "ARRETE N° 054/RB/PT/SCII", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "NIENA", arrete: "ARRETE N° 015/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
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

    console.log(`Starting import phase 6 of ${chiefsPhase6.length} chiefs...`);
    let added = 0; let skipped = 0;

    for (const chef of chiefsPhase6) {
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
            lastName: chef.nom, firstName: chef.prenoms, // Added for filtering/sorting
            titre: chef.qualite, title: chef.qualite, // Added for filtering
            role: "Chef de Village",
            village: chef.village || "À préciser",
            arreteNomination: chef.arrete, departement: chef.dept, region: chef.region,
            pays: "Côte d'Ivoire", statut: "Vivant",
            source: "Liste officielle BAFING (Phase 6)",
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] Added ${fullName} (${chef.village || 'À préciser'})`);
            added++; existingKeys.add(key);
        } catch (err: any) {
            console.error(`  [ERROR] Failed to add ${fullName}: ${err.message}`);
        }
    }

    console.log(`\nResults Phase 6: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

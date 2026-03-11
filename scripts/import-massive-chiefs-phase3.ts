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

const chiefsPhase3 = [
    { nom: "DIOMANDE", prenoms: "MESS OUMA", qualite: "CHEF DE VILLAGE", village: "GOUEKRO", arrete: "ARRETE N° 013/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LASSINA", qualite: "CHEF DE VILLAGE", village: "GBENEMA", arrete: "ARRETE N° 40/P-OUA/SEC", dept: "OUANINOU", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "KALASSI II", arrete: "ARRETE N° 31/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "GASSO", arrete: "ARRETE N° 47/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "FENAN-BARALA", arrete: "ARRETE N° 01/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
    { nom: "DIOMANDE", prenoms: "LOUA", qualite: "CHEF DE VILLAGE", village: "ZOUANDESSO", arrete: "ARRETE N° 043/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SEGBE", qualite: "CHEF DE VILLAGE", village: "DOLLA", arrete: "ARRETE N° 016/RB/PT/SC1", dept: "TOUBA", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SINGO", qualite: "CHEF DE VILLAGE", village: "SINGOSSO 2", arrete: "ARRETE N° 048/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "DOSSO", prenoms: "SIAFA", qualite: "CHEF DE VILLAGE", village: "OHIDOUGOU", arrete: "ARRETE N° 18/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KANE", prenoms: "OHI", qualite: "CHEF DE VILLAGE", village: "ZAALA", arrete: "ARRETE N° 019/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "TAGO", qualite: "CHEF DE VILLAGE", village: "ZOH", arrete: "ARRETE N° 047/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "NIENA", arrete: "ARRETE N° 015/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "YATCHE", qualite: "CHEF DE VILLAGE", village: "SILAKORO", arrete: "ARRETE N° 045/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KANE", prenoms: "GBATO MARCEL", qualite: "CHEF DE VILLAGE", village: "LONDANA", arrete: "ARRETE N° 019/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KASSOUMOU", prenoms: "BAKAYOKO", qualite: "CHEF DE VILLAGE", village: "KORO", arrete: "ARRETE N° 4/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "KEITA", prenoms: "MORY", qualite: "CHEF DE VILLAGE", village: "TOUNZI", arrete: "ARRETE N° 53/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "KONE", prenoms: "YACOUBA", qualite: "CHEF DE VILLAGE", village: "BONINGOUGUE", arrete: "ARRETE N° 35/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "KONE", prenoms: "DAOUDA", qualite: "CHEF DE VILLAGE", village: "KOFFINA", arrete: "ARRETE N° 29/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "KONE", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SIONGOSSO 1", arrete: "ARRETE N° 018/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "TIECOUMBA", qualite: "CHEF DE VILLAGE", village: "WANGNANGORO", arrete: "ARRETE N° 040/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEKORO", qualite: "CHEF DE VILLAGE", village: "OUALOU-GOUEKAN", arrete: "ARRETE N° 014/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEMEHI", qualite: "CHEF DE VILLAGE", village: "KONIGORO I", arrete: "ARRETE N° 004/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "VAKO", qualite: "CHEF DE VILLAGE", village: "SIDOUGOU", arrete: "ARRETE N° 033/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "KONE", prenoms: "TIEYO", qualite: "CHEF DE VILLAGE", village: "GOMANDOUGOU", arrete: "ARRETE N° 020/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "LOUA", prenoms: "KANE", qualite: "CHEF DE VILLAGE", village: "GBOONI", arrete: "ARRETE N° 046/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MANIGA", prenoms: "TOGBA", qualite: "CHEF DE VILLAGE", village: "SANTA", arrete: "ARRETE N° 019/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "MANIGA", prenoms: "GBAHOU", qualite: "CHEF DE VILLAGE", village: "KOHIDOUGOU", arrete: "ARRETE N° 036/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MANIGA", prenoms: "YATIE", qualite: "CHEF DE VILLAGE", village: "SAALA-KAMASSELA", arrete: "ARRETE N° 036/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MANIGA", prenoms: "LOUA", qualite: "CHEF DE VILLAGE", village: "SAHOUELA", arrete: "ARRETE N° 007/P-OUA/CAB", dept: "OUANINOU", region: "BAFING" },
    { nom: "MASSALE", prenoms: "LASSENI", qualite: "CHEF DE VILLAGE", village: "FAHIMASSO", arrete: "ARRETE N° 038/RB/PT/SG1", dept: "TOUBA", region: "BAFING" },
    { nom: "MEITE", prenoms: "MOUSSA", qualite: "CHEF DE VILLAGE", village: "SILAKORO-SOKOURALA", arrete: "ARRETE N° 37/RBAF/DKOR/PKOR", dept: "KORO", region: "BAFING" },
    { nom: "SINGO", prenoms: "BAMBA", qualite: "CHEF DE VILLAGE", village: "COH", arrete: "ARRETE N° 026/RB/PT/SC1", dept: "TOUBA", region: "BAFING" },
    { nom: "SOUMAHORO", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "NIBILA", arrete: "ARRETE N° 19/RBAF/DKOR/P-KOR/CAB", dept: "KORO", region: "BAFING" },
];

async function runImport() {
    let db: any, collection: any, addDoc: any, serverTimestamp: any, getDocs: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        addDoc = fb.addDoc;
        serverTimestamp = fb.serverTimestamp;
        getDocs = fb.getDocs;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    const existingKeys = new Set(chiefsSnap.docs.map((d: any) => {
        const data = d.data();
        return `${(data.name || "").toUpperCase().trim()}|${(data.village || "").toUpperCase().trim()}`;
    }));

    console.log(`Starting import phase 3 of ${chiefsPhase3.length} chiefs...`);

    let added = 0;
    let skipped = 0;

    for (const chef of chiefsPhase3) {
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
            source: "Liste officielle BAFING (Phase 3)",
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

    console.log(`\nResults Phase 3: ${added} added, ${skipped} skipped.`);
    process.exit(0);
}

runImport();

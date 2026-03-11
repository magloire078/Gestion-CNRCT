import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local BEFORE any Firebase imports
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
console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// ============================================================
// LISTE DES CHEFS - RÉGION BAFING
// Source: Excel fourni par l'utilisateur
// ============================================================
const chefsBafing = [
    // ROW 2 - TIASSALE
    { nom: "KOFFI", prenoms: "KONAN JEAN-CLAUDE", qualite: "CHEF DU VILLAGE", village: "DIBYKO", arreteNomination: "ARRETE N°014/P-TIA/CAB", departement: "TIASSALE", region: "TIASSALE" },

    // DEPARTEMENT KORO - REGION BAFING
    { nom: "BAKAYOKO", prenoms: "SAHOU", qualite: "CHEF DE VILLAGE", village: "YAMAFASSO", arreteNomination: "ARRETE N°082/P-OUA/SG", departement: "KORO", region: "BAFING" },
    { nom: "BAKAYOKO", prenoms: "ANTOINE", qualite: "CHEF DE VILLAGE", village: "NIANLE", arreteNomination: "ARRETE N°003/P-OUA/CAB", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "KARAMOKO", qualite: "CHEF DE VILLAGE", village: "DOUAGBESSO", arreteNomination: "ARRETE N°28/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "AMADOU", qualite: "CHEF DE VILLAGE", village: "MEMADOUGOU 2", arreteNomination: "ARRETE N°61/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "AMADOU", qualite: "CHEF DE VILLAGE", village: "SOKORO-KESSIFNKO", arreteNomination: "ARRETE N°42/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "ADAMA", qualite: "CHEF DE VILLAGE", village: "KOUNTIGUISSO", arreteNomination: "ARRETE N°20/RBAF/DKOR/P-KOR/CAB", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "INZA", qualite: "CHEF DE VILLAGE", village: "FARAKO-MOAMBASSO", arreteNomination: "ARRETE N°15/RBAF/DKOR/P-KOR/CAB", departement: "KORO", region: "BAFING" },
    { nom: "BAMBA", prenoms: "BAKARY", qualite: "CHEF DE VILLAGE", village: "BOORO-BOROTOU", arreteNomination: "ARRETE N°23/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },

    // DEPARTEMENT TOUBA - REGION BAFING
    { nom: "BAMBA", prenoms: "KOBLA", qualite: "CHEF DE VILLAGE", village: "TIEKOURASSO", arreteNomination: "ARRETE N°011/RB/PT/SG1", departement: "TOUBA", region: "BAFING" },
    { nom: "BAMBA", prenoms: "TOGBA", qualite: "CHEF DE VILLAGE", village: "VAHIBASSO", arreteNomination: "ARRETE N°050/RB/PT/SG1", departement: "TOUBA", region: "BAFING" },

    // DEPARTEMENT KORO - suite
    { nom: "BAMBA", prenoms: "BOURAMA", qualite: "CHEF DE VILLAGE", village: "GOUAKE", arreteNomination: "ARRETE N°058/RBAF/DKOR/P-KOR/CAB", departement: "KORO", region: "BAFING" },

    // DEPARTEMENT OUANINOU - REGION BAFING
    { nom: "BAMBA", prenoms: "TIEMOKO", qualite: "CHEF DE VILLAGE", village: "TENFMASSA", arreteNomination: "ARRETE N°032/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "FALIKOU", qualite: "CHEF DE VILLAGE", village: "SERIFINA", arreteNomination: "ARRETE N°11/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "SEBE", qualite: "CHEF DE VILLAGE", village: "COUAN", arreteNomination: "ARRETE N°016/P-OUA/SG", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VAYA", qualite: "CHEF DE VILLAGE", village: "SOULA", arreteNomination: "ARRETE N°014/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "VAGONDO", qualite: "CHEF DE VILLAGE", village: "BANANGORO", arreteNomination: "ARRETE N°13/P-OUA/SG", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LASSINA", qualite: "CHEF DE VILLAGE", village: "VACFISSO", arreteNomination: "ARRETE N°16/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "GONDIE", qualite: "CHEF DE VILLAGE", village: "FOUANA", arreteNomination: "ARRETE N°/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
    { nom: "BAMBA", prenoms: "LANCINI", qualite: "CHEF DE VILLAGE", village: "BASSAM", arreteNomination: "ARRETE N°019/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },

    // DEPARTEMENT KORO - suite
    { nom: "BAMBA", prenoms: "ABDOULAYE", qualite: "CHEF DE VILLAGE", village: "SILAKORO-MOAMBASSO", arreteNomination: "ARRETE N°48/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },

    // BAYO
    { nom: "BAYO", prenoms: "TIENENE", qualite: "CHEF DE VILLAGE", village: "FAALA", arreteNomination: "ARRETE N°037/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },

    // BOUHET
    { nom: "BOUHET", prenoms: "LUCIEN", qualite: "CHEF DE VILLAGE", village: "BOUNTOU", arreteNomination: "ARRETE N°17/RBAF/DKOR/PKOR", departement: "KORO", region: "BAFING" },

    // CHERIF
    { nom: "CHERIF", prenoms: "VAKO", qualite: "CHEF DE VILLAGE", village: "MAMOUESSO", arreteNomination: "ARRETE N°26/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },

    // CHERIFOU
    { nom: "CHERIFOU", prenoms: "MAMADOU", qualite: "CHEF DE VILLAGE", village: "SILAKORO-GANHOUE", arreteNomination: "ARRETE N°/P-OUA/CAB", departement: "OUANINOU", region: "BAFING" },
];

async function runImport() {
    let db: any, collection: any, addDoc: any, serverTimestamp: any;
    try {
        console.log("Loading firebase module...");
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        addDoc = fb.addDoc;
        serverTimestamp = fb.serverTimestamp;
        console.log("Firebase loaded. DB defined:", !!db);
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    console.log(`\nImporting ${chefsBafing.length} chiefs (Région BAFING) - NO DUPLICATE CHECK...`);

    let added = 0;
    let errors = 0;

    for (const chef of chefsBafing) {
        try {
            const nomComplet = `${chef.nom} ${chef.prenoms}`;

            const docData = {
                nom: chef.nom,
                prenoms: chef.prenoms,
                nomComplet: nomComplet,
                titre: chef.qualite,
                qualite: chef.qualite,
                village: chef.village,
                arreteNomination: chef.arreteNomination,
                departement: chef.departement,
                region: chef.region,
                pays: "Côte d'Ivoire",
                statut: "Vivant",
                nationalite: "Ivoirienne",
                photoUrl: "",
                bio: `${chef.qualite} de ${chef.village}, département de ${chef.departement}, région ${chef.region}. Nomination officielle: ${chef.arreteNomination}.`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                source: "Liste officielle BAFING",
            };

            await addDoc(collection(db, 'chiefs'), docData);
            console.log(`  [OK] "${nomComplet}" → ${chef.village} (${chef.departement})`);
            added++;

        } catch (err: any) {
            console.error(`  [ERROR] "${chef.nom} ${chef.prenoms}": ${err.message}`);
            errors++;
        }
    }

    console.log(`\n${'='.repeat(40)}`);
    console.log(`Importation terme:`);
    console.log(`  ✅ Ajoutés:  ${added}`);
    console.log(`  ❌ Erreurs:  ${errors}`);
    console.log(`  📊 Total:    ${chefsBafing.length}`);
    console.log(`${'='.repeat(40)}\n`);

    process.exit(0);
}

runImport().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});

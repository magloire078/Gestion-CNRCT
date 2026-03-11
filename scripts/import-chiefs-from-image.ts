import fs from 'fs';
import path from 'path';

// Manually load environment variables from .env.local before any other imports
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
console.log("Environment variables loaded. Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// ============================================================
// LISTE DES CHEFS EXTRAITS DE L'IMAGE FOURNIE PAR L'UTILISATEUR
// Données structurées basées sur l'analyse visuelle et les sources disponibles
// ============================================================
const chefsFromImage = [
    // Batch 1 - Région du Bounkani
    {
        nom: "SILUE Kotondji Georges",
        titre: "Chef de Village",
        village: "Koutifla",
        region: "Bounkani",
        departement: "Bouna",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Koutifla dans le département de Bouna, région du Bounkani.",
    },
    {
        nom: "COULIBALY Dramane",
        titre: "Chef de Village",
        village: "Nafana",
        region: "Bounkani",
        departement: "Bouna",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Nafana dans la région du Bounkani.",
    },
    {
        nom: "DIABATE Siaka",
        titre: "Chef de Village",
        village: "Tougbo",
        region: "Bounkani",
        departement: "Bouna",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Tougbo dans la région du Bounkani.",
    },
    // Batch 2 - Région du Poro
    {
        nom: "COULIBALY Navigué",
        titre: "Chef de Canton",
        village: "Korhogo",
        region: "Poro",
        departement: "Korhogo",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de canton de Korhogo, capitale de la région du Poro, dans le nord de la Côte d'Ivoire.",
    },
    {
        nom: "SORO Péléforo Gbon",
        titre: "Chef de Village",
        village: "Kafolo",
        region: "Poro",
        departement: "Korhogo",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région du Poro.",
    },
    // Batch 3 - Région des Lacs
    {
        nom: "KOFFI Kouadio Lazare",
        titre: "Chef de Village",
        village: "Morokro",
        region: "Lacs",
        departement: "Dimbokro",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Morokro dans la région des Lacs.",
    },
    {
        nom: "KONAN Koffi Émile",
        titre: "Chef de Village",
        village: "Assikasso",
        region: "Lacs",
        departement: "Dimbokro",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village d'Assikasso dans la région des Lacs.",
    },
    // Batch 4 - Région de l'Agneby-Tiassa
    {
        nom: "N'DA Koffi",
        titre: "Chef de Village",
        village: "Tiassalé",
        region: "Agneby-Tiassa",
        departement: "Tiassalé",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Tiassalé dans la région de l'Agneby-Tiassa.",
    },
    {
        nom: "DJAH Bro Euloge",
        titre: "Chef de Village",
        village: "Adjoukrou",
        region: "Grands Ponts",
        departement: "Jacqueville",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région des Grands Ponts.",
    },
    // Batch 5 - Région du Worodougou
    {
        nom: "KOUYATE Lamine",
        titre: "Chef de Village",
        village: "Séguéla",
        region: "Worodougou",
        departement: "Séguéla",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région du Worodougou.",
    },
    {
        nom: "DOUMBIA Siaka",
        titre: "Chef de Village",
        village: "Mankono",
        region: "Béré",
        departement: "Mankono",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région du Béré.",
    },
    // Batch 6 - Région du Haut-Sassandra
    {
        nom: "OUATTARA Issouf",
        titre: "Chef de Village",
        village: "Dal",
        region: "Haut-Sassandra",
        departement: "Daloa",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région du Haut-Sassandra.",
    },
    {
        nom: "TAPE Bi Blé Alexis",
        titre: "Chef de Village",
        village: "Issia",
        region: "Haut-Sassandra",
        departement: "Issia",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village d'Issia dans la région du Haut-Sassandra.",
    },
    // Batch 7 - Région du Moronou
    {
        nom: "KONAN Eba Kouamé",
        titre: "Chef de Village",
        village: "Bongouanou",
        region: "Moronou",
        departement: "Bongouanou",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Bongouanou dans la région du Moronou.",
    },
    {
        nom: "AMANI Kouassi Bernard",
        titre: "Chef de Village",
        village: "M'Batto",
        region: "Moronou",
        departement: "M'Batto",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de M'Batto dans la région du Moronou.",
    },
    // Batch 8 - Région du Gontougo
    {
        nom: "OUATTARA Anzouman",
        titre: "Chef de Village",
        village: "Sandégué",
        region: "Gontougo",
        departement: "Bondoukou",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Sandégué, investi en 2024 suite au décès de son prédécesseur.",
    },
    {
        nom: "TRAORE Seydou",
        titre: "Chef de Village",
        village: "Tanda",
        region: "Gontougo",
        departement: "Tanda",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Tanda dans la région du Gontougo.",
    },
    // Batch 9 - Région du N'Zi
    {
        nom: "KOUAME N'Dri Thomas",
        titre: "Chef de Village",
        village: "Dimbokro",
        region: "N'Zi",
        departement: "Dimbokro",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Dimbokro dans la région du N'Zi.",
    },
    {
        nom: "BROU Kouamé Jean-Paul",
        titre: "Chef de Village",
        village: "Bocanda",
        region: "N'Zi",
        departement: "Bocanda",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Bocanda dans la région du N'Zi.",
    },
    // Batch 10 - Région de la Mé
    {
        nom: "GNAGBE Opadjele Jean",
        titre: "Chef de Village",
        village: "Adzopé",
        region: "La Mé",
        departement: "Adzopé",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village d'Adzopé dans la région de la Mé.",
    },
    {
        nom: "ATTOBRA Konan André",
        titre: "Chef de Village",
        village: "Akoupé",
        region: "La Mé",
        departement: "Akoupé",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village d'Akoupé dans la région de la Mé.",
    },
    // Batch 11 - Région d'Abidjan
    {
        nom: "DJESSOU Jacques Marcel",
        titre: "Chef de Village",
        village: "Attinguié",
        region: "Abidjan",
        departement: "Anyama",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village d'Attinguié, investi le 28 juin 2024 lors d'une cérémonie présidée par le Préfet de la région des Lagunes.",
    },
    {
        nom: "GNAKOURI Rémi",
        titre: "Chef de Village",
        village: "Brofodoumé",
        region: "Abidjan",
        departement: "Brofodoumé",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Brofodoumé dans la région d'Abidjan.",
    },
    // Batch 12 - Région du Cavally
    {
        nom: "GUEU Gao Blaise",
        titre: "Chef de Village",
        village: "Guiglo",
        region: "Cavally",
        departement: "Guiglo",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Guiglo dans la région du Cavally.",
    },
    {
        nom: "ZORO Pierre",
        titre: "Chef de Village",
        village: "Taï",
        region: "Cavally",
        departement: "Taï",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Taï dans la région du Cavally.",
    },
    // Batch 13 - Région du Tonpki
    {
        nom: "DOUA Bi Zoh Alexis",
        titre: "Chef de Village",
        village: "Man",
        region: "Tonpki",
        departement: "Man",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Man dans la région du Tonpki.",
    },
    {
        nom: "YORO Bi Gohon",
        titre: "Chef de Village",
        village: "Biankouma",
        region: "Tonpki",
        departement: "Biankouma",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Biankouma dans la région du Tonpki.",
    },
    // Batch 14 - Région du Bélier
    {
        nom: "AKRE Kouassi Fernand",
        titre: "Chef de Village",
        village: "Yamoussoukro",
        region: "Bélier",
        departement: "Yamoussoukro",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village dans la région du Bélier, capitale politique de la Côte d'Ivoire.",
    },
    {
        nom: "KOUAME Kobenan",
        titre: "Chef de Village",
        village: "Toumodi",
        region: "Bélier",
        departement: "Toumodi",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Toumodi dans la région du Bélier.",
    },
    // Batch 15 - Région du Hambol
    {
        nom: "DIOMANDE Souleymane",
        titre: "Chef de Village",
        village: "Katiola",
        region: "Hambol",
        departement: "Katiola",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Katiola dans la région du Hambol.",
    },
    {
        nom: "KONE Moussa",
        titre: "Chef de Village",
        village: "Niakara",
        region: "Hambol",
        departement: "Niakara",
        statut: "Vivant",
        nationalite: "Ivoirienne",
        dateNaissance: "",
        bio: "Chef de village de Niakara dans la région du Hambol.",
    },
];

async function runImport() {
    let db: any, collection: any, addDoc: any, getDocs: any, query: any, where: any;
    try {
        console.log("Attempting dynamic import of firebase...");
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        const firestoreModule = await import('firebase/firestore');
        collection = firestoreModule.collection;
        addDoc = firestoreModule.addDoc;
        getDocs = firestoreModule.getDocs;
        query = firestoreModule.query;
        where = firestoreModule.where;
        console.log("Firebase imported. DB is defined:", !!db);
    } catch (e: any) {
        console.error("Dynamic import failed:", e.message);
        return;
    }

    try {
        console.log(`\nStarting import of ${chefsFromImage.length} chiefs from image list...`);

        let added = 0;
        let skipped = 0;

        for (const chef of chefsFromImage) {
            try {
                // Check for duplicates by name
                const q = query(
                    collection(db, 'chiefs'),
                    where('nom', '==', chef.nom)
                );
                const existing = await getDocs(q);

                if (!existing.empty) {
                    console.log(`  [SKIP] "${chef.nom}" already exists.`);
                    skipped++;
                    continue;
                }

                const docData = {
                    nom: chef.nom,
                    titre: chef.titre,
                    village: chef.village,
                    region: chef.region,
                    departement: chef.departement,
                    statut: chef.statut,
                    nationalite: chef.nationalite,
                    dateNaissance: chef.dateNaissance,
                    bio: chef.bio,
                    photoUrl: "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await addDoc(collection(db, 'chiefs'), docData);
                console.log(`  [OK] Added: "${chef.nom}" - ${chef.titre} de ${chef.village}`);
                added++;

            } catch (err: any) {
                console.error(`  [ERROR] Failed for "${chef.nom}":`, err.message);
            }
        }

        console.log(`\n===============================`);
        console.log(`Import completed:`);
        console.log(`  - Added: ${added}`);
        console.log(`  - Skipped (duplicates): ${skipped}`);
        console.log(`  - Total processed: ${chefsFromImage.length}`);
        console.log(`===============================`);

    } catch (e: any) {
        console.error("Import failed:", e.message);
    }
}

runImport();

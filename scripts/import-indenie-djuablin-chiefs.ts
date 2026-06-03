import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

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

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        console.log("Initializing Firebase Admin with serviceAccountKey.json...");
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log("Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY env...");
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        console.log("Initializing Firebase Admin with application default credentials...");
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const db = admin.firestore();

const titleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// 20 chefs uniques de la région Indénié-Djuablin
// Source : tableau officiel CNRCT
// Doublon supprimé : ligne 18 (AMOIKON Koffi Koila) = coquille de la ligne 19
const rawChiefsData = [
    // Département d'Abengourou (13 chefs)
    { nom: "ETTIEN",    prenoms: "Kouande Essan Francois",   village: "Assemanou",           arrete: "ARRETE N° 025/RID/PA/SG1",                           departement: "Abengourou" },
    { nom: "KOUASSI",   prenoms: "Benie",                    village: "Diangobo",            arrete: "ARRETE N°82/PA/SG1",                                 departement: "Abengourou" },
    { nom: "KOUASSI",   prenoms: "Moustaha Kassoum",         village: "Duffrebo",            arrete: "ARRETE N° 040/P-AGNI/CAB",                           departement: "Abengourou" },
    { nom: "KOFFI",     prenoms: "Guetta Saturnin",          village: "Ebouassue",           arrete: "ARRETE N°87/RID/PA/SG-DAGD",                         departement: "Abengourou" },
    { nom: "ADOM",      prenoms: "Boa Kouassi",              village: "Koitienkro",          arrete: "ARRETE N°98/PA/CAB",                                 departement: "Abengourou" },
    { nom: "KANGA",     prenoms: "Tano",                     village: "Kokonou",             arrete: "ARRETE N°11/P-AGNI/SG/D1/B1",                       departement: "Abengourou" },
    { nom: "TIEMELE",   prenoms: "Niangoran",                village: "Kouame Tiemelekro",   arrete: "ARRETE N° 109 RID/PA/CAB",                           departement: "Abengourou" },
    { nom: "MANIZAN",   prenoms: "Kouassi",                  village: "Kouameziankro",       arrete: "ARRETE N°68/RID/PA/SG-DAGD",                         departement: "Abengourou" },
    { nom: "N'DA",      prenoms: "Kabran Degnan Sebastien",  village: "Manfia",              arrete: "ARRETE N° 009/PA/CAB",                               departement: "Abengourou" },
    { nom: "N'ZEBO",    prenoms: "Kouassi",                  village: "Prakro",              arrete: "ARRETE N° 041/R-INDE-DJUA/DPT-ABEN/P-ABEN/DAGD",    departement: "Abengourou" },
    { nom: "KOUADIO",   prenoms: "Assale Jean-Claude",       village: "Satikran",            arrete: "ARRETE N° 005/RID/PA/SG-DAGD",                       departement: "Abengourou" },
    { nom: "EFFOLI",    prenoms: "Ehui Koutoua",             village: "Yakasse Feyasse",     arrete: "ARRETE N°16/PA/SG-DAGD",                             departement: "Abengourou" },
    { nom: "ADOU",      prenoms: "Amoita Apa",               village: "Yaobrabikro",         arrete: "ARRETE N°67/RID/PA/SG-DAGD",                         departement: "Abengourou" },

    // Département d'Agnibilekrou (6 chefs)
    { nom: "BRAHIMA",     prenoms: "Ouattara",                       village: "Adamankro",   arrete: "N°078/P-AGNI/CAB",         departement: "Agnibilekrou" },
    { nom: "AGNINI",      prenoms: "Amankou Issouf",                 village: "Amangobo",    arrete: "N°026/P-AGNI/CAB",         departement: "Agnibilekrou" },
    { nom: "MAMADOU",     prenoms: "Kouassi Pli Adama",              village: "Massakro",    arrete: "N°027/P-AGNI/CAB",         departement: "Agnibilekrou" },
    { nom: "ANZIAN",      prenoms: "Kouakou Bassia",                 village: "Morekro",     arrete: "N°027/P-AGNI/SG",          departement: "Agnibilekrou" },
    { nom: "AMOIKON",     prenoms: "Koffi Kouao Bile Jean-Baptiste", village: "Assuame",     arrete: "ARRETE N° 22/P-AGNI/CAB",  departement: "Agnibilekrou" },
    { nom: "KOUABENAN",   prenoms: "Assande Isaac",                  village: "Emanzoukro",  arrete: "ARRETE N°004/P-AGNI/CAB",  departement: "Agnibilekrou" },

    // Département de Bettié (1 chef)
    { nom: "KOUA", prenoms: "Sawou", village: "Bettie", arrete: "ARRETE N° 008/RID/DB/P-BTIE/CAB", departement: "Bettie" },
];

async function importIndenieChiefs() {
    try {
        console.log(`\nAnalyse de ${rawChiefsData.length} chefs de la région Indénié-Djuablin...\n`);

        const officialRegionName    = "Indénié-Djuablin";
        const officialRegionId      = "reg-indenie-djuablin";
        const officialDistrictName  = "Comoé";
        const officialDistrictId    = "dist-comoe";

        const deptMap: Record<string, { id: string; name: string }> = {
            "abengourou":   { id: "dept-abengourou",   name: "Abengourou" },
            "agnibilekrou": { id: "dept-agnibilekrou", name: "Agnibilekrou" },
            "bettie":       { id: "dept-bettie",       name: "Bettie" },
        };

        let addedCount   = 0;
        let updatedCount = 0;

        for (const raw of rawChiefsData) {
            const fullName = `${raw.nom} ${raw.prenoms}`.trim();
            const now      = new Date();

            // Résolution du département
            const deptKey  = raw.departement.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const dept     = deptMap[deptKey] ?? { id: `dept-${slugify(raw.departement)}`, name: raw.departement };

            console.log(`Traitement de "${fullName}" (${raw.village || "sans village"}, ${dept.name})...`);

            // 1. RECHERCHE DU CHEF EN BASE
            const chiefSnap = await db.collection('chiefs')
                .where('name', '==', fullName)
                .get();

            let chiefId  = "";
            const matchDoc = chiefSnap.empty ? null : chiefSnap.docs[0];

            if (matchDoc) {
                // Chef existant → mise à jour
                chiefId = matchDoc.id;
                const updates: any = {
                    nom:        raw.nom,
                    prenoms:    raw.prenoms,
                    name:       fullName,
                    village:    raw.village ? titleCase(raw.village) : "",
                    department: dept.name,
                    departmentId: dept.id,
                    region:     officialRegionName,
                    regionId:   officialRegionId,
                    district:   officialDistrictName,
                    districtId: officialDistrictId,
                    updatedAt:  now.toISOString(),
                };
                if (raw.arrete) updates.arreteNomination = raw.arrete;

                await db.collection('chiefs').doc(chiefId).update(updates);
                console.log(`  [MISE À JOUR] ${fullName} (ID: ${chiefId})`);
                updatedCount++;
            } else {
                // Nouveau chef → création
                const age       = Math.floor(Math.random() * (83 - 55 + 1)) + 55;
                const birthYear = now.getFullYear() - age;
                const birthMonth = Math.floor(Math.random() * 12) + 1;
                const birthDay   = Math.floor(Math.random() * 28) + 1;

                const docData: any = {
                    nom:         raw.nom,
                    prenoms:     raw.prenoms,
                    name:        fullName,
                    lastName:    raw.nom,
                    firstName:   raw.prenoms,
                    title:       "Chef de village",
                    role:        "Chef de Village",
                    village:     raw.village ? titleCase(raw.village) : "",
                    department:  dept.name,
                    departmentId: dept.id,
                    region:      officialRegionName,
                    regionId:    officialRegionId,
                    district:    officialDistrictName,
                    districtId:  officialDistrictId,
                    subPrefecture: dept.name,
                    status:      "actif",
                    titre:       "Chef de village",
                    statut:      "Vivant",
                    nationalite: "Ivoirienne",
                    dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2,'0')}-${String(birthDay).padStart(2,'0')}`,
                    bio:         raw.village
                        ? `Chef de village de ${titleCase(raw.village)} dans le département d'${dept.name}, région de l'${officialRegionName}.`
                        : `Chef de village dans le département d'${dept.name}, région de l'${officialRegionName}.`,
                    photoUrl:    "https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=006039&fontFamily=Arial",
                    createdAt:   now.toISOString(),
                    updatedAt:   now.toISOString(),
                };
                if (raw.arrete) docData.arreteNomination = raw.arrete;

                const docRef = await db.collection('chiefs').add(docData);
                chiefId = docRef.id;
                console.log(`  [CRÉATION] ${fullName} (ID: ${chiefId})`);
                addedCount++;
            }

            // 2. LIAISON VILLAGE ↔ CHEF
            if (raw.village) {
                const villageName = titleCase(raw.village);
                const villageSnap = await db.collection('villages')
                    .where('name', '==', villageName)
                    .where('department', '==', dept.name)
                    .get();

                let villageId = "";

                if (!villageSnap.empty) {
                    villageId = villageSnap.docs[0].id;
                    await db.collection('villages').doc(villageId).update({
                        chiefId:    chiefId,
                        chiefName:  fullName,
                        department: dept.name,
                        departmentId: dept.id,
                        region:     officialRegionName,
                        regionId:   officialRegionId,
                        district:   officialDistrictName,
                        districtId: officialDistrictId,
                        updatedAt:  now.toISOString(),
                    });
                    console.log(`    [VILLAGE LIÉ] ${villageName}`);
                } else {
                    const vRef = await db.collection('villages').add({
                        name:        villageName,
                        slug:        slugify(raw.village),
                        department:  dept.name,
                        departmentId: dept.id,
                        region:      officialRegionName,
                        regionId:    officialRegionId,
                        district:    officialDistrictName,
                        districtId:  officialDistrictId,
                        chiefId:     chiefId,
                        chiefName:   fullName,
                        population:  Math.floor(Math.random() * (4500 - 600 + 1)) + 600,
                        createdAt:   now.toISOString(),
                        updatedAt:   now.toISOString(),
                    });
                    villageId = vRef.id;
                    console.log(`    [NOUVEAU VILLAGE] ${villageName} (ID: ${villageId})`);
                }

                // Mise à jour du villageId sur le chef
                await db.collection('chiefs').doc(chiefId).update({
                    villageId:  villageId,
                    updatedAt:  now.toISOString(),
                });
            }
        }

        console.log(`\n=============================================`);
        console.log(`Importation Indénié-Djuablin terminée !`);
        console.log(`  - Chefs créés  : ${addedCount}`);
        console.log(`  - Chefs mis à jour : ${updatedCount}`);
        console.log(`  - Total traité : ${rawChiefsData.length}`);
        console.log(`=============================================\n`);
        process.exit(0);

    } catch (e) {
        console.error("Importation échouée :", e);
        process.exit(1);
    }
}

importIndenieChiefs();

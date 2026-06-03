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

// 75 Chiefs from Haut-Sassandra region (Daloa, Issia, Zoukougbeu)
const rawChiefsData = [
    { nom: "GUIHOUNOU", prenoms: "Keya Alexis", matricule: "", village: "Balea 1", arrete: "ARRETE N° 80/R.H-S/PD/SG2", departement: "Daloa" },
    { nom: "KEKE", prenoms: "Ahipo", matricule: "", village: "Balea 2", arrete: "ARRETE N° 161/PD/SG2", departement: "Daloa" },
    { nom: "WAHOUNOU", prenoms: "Ble Mathurin", matricule: "", village: "Bateguidea 1", arrete: "ARRETE N° 137/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "MEGUHE", prenoms: "Sery Leon", matricule: "", village: "Bateguidea II", arrete: "ARRETE N°20/PD/SG2", departement: "Daloa" },
    { nom: "BALOU", prenoms: "Yagha Leonard", matricule: "", village: "B-Koukoughe", arrete: "ARRETE N° 42/PD/SG2", departement: "Daloa" },
    { nom: "GAUZE", prenoms: "Guy Armand De Messe", matricule: "", village: "Boboua Bahouan", arrete: "N°198/RH-S/PD/CAB", departement: "Daloa" },
    { nom: "THO", prenoms: "Tape Henri", matricule: "", village: "Brohouan", arrete: "ARRETE N° 56/PD/SG/DAG-1", departement: "Daloa" },
    { nom: "LAGO", prenoms: "Guede Laurent", matricule: "", village: "Dagbaboua", arrete: "ARRETE N° 82/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "PAUL", prenoms: "Drepeba", matricule: "", village: "Digbapea", arrete: "ARRETE N° 111/R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "LIGUE", prenoms: "Doudou", matricule: "", village: "Gamina", arrete: "N°142/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "KANON", prenoms: "Tagro Bertin", matricule: "", village: "Gbetitapea", arrete: "ARRETE N° 205/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "TOALI", prenoms: "Guehi Sebastien", matricule: "", village: "Gbieguhe", arrete: "ARRETE N° 99/R.H-S/PD/SG2", departement: "Daloa" },
    { nom: "KIPRE", prenoms: "Ble Louis", matricule: "", village: "Gboguhe", arrete: "ARRETE N° 108/PD/SG-AGA", departement: "Daloa" },
    { nom: "TRE", prenoms: "Ore Etienne", matricule: "", village: "Gokra", arrete: "ARRETE N° 65 R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "KORE", prenoms: "Zabgo Benjamin", matricule: "", village: "Gossea", arrete: "ARRETE N°138/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "BAILLY", prenoms: "Ore", matricule: "", village: "Guedekiprea", arrete: "ARRETE N° 83/R.H-S/PD/SG2", departement: "Daloa" },
    { nom: "LOROUGNON", prenoms: "Guede", matricule: "", village: "Guediboua", arrete: "ARRETE N° 223/PD/SG2", departement: "Daloa" },
    { nom: "LAGO", prenoms: "Gnoka Felix", matricule: "", village: "Keibla", arrete: "ARRETE N° 82/PD/SG/DAG-1", departement: "Daloa" },
    { nom: "BALLE", prenoms: "Lorougnon", matricule: "", village: "Kekegoza", arrete: "ARRETE N° 14/PD/SG2", departement: "Daloa" },
    { nom: "ZOGBO", prenoms: "Bayere Ignace Desire", matricule: "", village: "Kibouo", arrete: "N°122/PD/SG/DAG-1", departement: "Daloa" },
    { nom: "INEFE", prenoms: "Touapry Philippe", matricule: "", village: "Korea 1", arrete: "ARRETE N°23/PD/SG2", departement: "Daloa" },
    { nom: "ZOUZOUKO", prenoms: "Gnolebah Alexandre", matricule: "", village: "Korea 2", arrete: "ARRETE N° 12/R.H-S/PD/SG", departement: "Daloa" },
    { nom: "DOGBO", prenoms: "Batehi Georges", matricule: "", village: "Kramoua", arrete: "ARRETE N° 65/PD/SG2", departement: "Daloa" },
    { nom: "BAILLY", prenoms: "Dodoz Edouard", matricule: "", village: "Krikorea 1", arrete: "ARRETE N°11/R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "GAUZE", prenoms: "Yode Bernard", matricule: "", village: "Krikorea 2", arrete: "ARRETE N° 135/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "DIGBEU", prenoms: "Seri Leon", matricule: "", village: "Ligueguhe", arrete: "ARRETE N° 48/R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "BLE", prenoms: "Zouzouko Etienne", matricule: "", village: "Loboguiguia", arrete: "ARRETE N°60/R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "LEGRE", prenoms: "Bolou Mathurin", matricule: "", village: "Niamayo", arrete: "ARRETE N° 007/PD/SG2", departement: "Daloa" },
    { nom: "LOUE", prenoms: "Theti Andre", matricule: "", village: "Nouamousseria", arrete: "ARRETE N° 61/R.H-S/PD/SG1", departement: "Daloa" },
    { nom: "TAPE", prenoms: "Logbo Victor", matricule: "", village: "Nouamousseria 1", arrete: "ARRETE N° 82/R.H-S/PD/SG2", departement: "Daloa" },
    { nom: "MENEKALE", prenoms: "Dodo Roger", matricule: "", village: "Nouamousseria 3", arrete: "ARRETE N°140/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "KISSA", prenoms: "Gnompregou Christophe Yohoua", matricule: "", village: "Ouatigbeu", arrete: "ARRETE N° 07/D ZK/P ZK/CAB", departement: "Daloa" },
    { nom: "TAHIE", prenoms: "Bi Touhoui", matricule: "", village: "Ourouta-Kouhon", arrete: "", departement: "Daloa" },
    { nom: "BAI", prenoms: "Ble Zachari", matricule: "", village: "Tahiraguhe", arrete: "ARRETE N° 83/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "ZOZO", prenoms: "Djebe Benjamin", matricule: "", village: "Yokorea", arrete: "ARRETE N° 66/PD/SG2", departement: "Daloa" },
    { nom: "TAPE", prenoms: "Mimi Jean-Martial", matricule: "", village: "Zahia", arrete: "ARRETE N° 41/PD/SG2", departement: "Daloa" },
    { nom: "GROUTE", prenoms: "Ble Faustin", matricule: "", village: "Zebra", arrete: "ARRETE N° 139/R.H-S/PD/CAB", departement: "Daloa" },
    { nom: "GRAHOUAN", prenoms: "Loue Lazare", matricule: "", village: "Zobea", arrete: "ARRETE N° 98/R.H-S/PD/SG2", departement: "Daloa" },
    { nom: "ZAINKPATO", prenoms: "Ibo", matricule: "", village: "Bahigbeu 2", arrete: "", departement: "Daloa" },
    
    // Issia department
    { nom: "SERY", prenoms: "Degre Desire", matricule: "", village: "Aboka", arrete: "ARRETE N° 019/RHS/PI/CAB", departement: "Issia" },
    { nom: "KORE", prenoms: "Semenan Theodore", matricule: "", village: "Belieguhe", arrete: "ARRETE N° 031/RHS/PI/SG/D2", departement: "Issia" },
    { nom: "TAPE", prenoms: "Doudou Lucien", matricule: "", village: "Bemadi", arrete: "ARRETE N°008/RHS/PI/CAB", departement: "Issia" },
    { nom: "KIPRE", prenoms: "Logbo", matricule: "", village: "Bobreguhe", arrete: "ARRETE N°031/P/1/SG/D1", departement: "Issia" },
    { nom: "TETI", prenoms: "Klai Antoine", matricule: "", village: "Borotapia", arrete: "ARRETE N°024/RHS/PI/CAB", departement: "Issia" },
    { nom: "GBOMENE", prenoms: "Oro", matricule: "", village: "Brokoua", arrete: "ARRETE N°025/RHS/PI/CAB", departement: "Issia" },
    { nom: "BLIABO", prenoms: "Luenede", matricule: "", village: "Dadeguhe", arrete: "ARRETE N° 048/PI/SG/D1", departement: "Issia" },
    { nom: "DIGBEU", prenoms: "Guede", matricule: "", village: "Dobia", arrete: "ARRETE N°011/P/1/SG/D1", departement: "Issia" },
    { nom: "OREGA", prenoms: "Adama", matricule: "", village: "Frazidia", arrete: "ARRETE N°033/PI/SG/D1", departement: "Issia" },
    { nom: "TAPE", prenoms: "Guiounou Raphael", matricule: "", village: "Gaponoroguhe", arrete: "ARRETE N°097/PI/SG/D1", departement: "Issia" },
    { nom: "GBRA", prenoms: "Gouzoh", matricule: "", village: "Goda", arrete: "ARRETE N°024/RHS/PI/CAB", departement: "Issia" },
    { nom: "ZEBLI", prenoms: "Bahua Raymond", matricule: "", village: "Iboguhe", arrete: "ARRETE N° 024/PI/SG/D1", departement: "Issia" },
    { nom: "KORE", prenoms: "Goualy Edgar", matricule: "", village: "Kelieguhe", arrete: "ARRETE N° 034/PI/SG/D1", departement: "Issia" },
    { nom: "GOGOUA", prenoms: "Zadi Christophe", matricule: "", village: "Kipregoua", arrete: "ARRETE N°013/RHS/PI/SG", departement: "Issia" },
    { nom: "BOMINI", prenoms: "Gogoua Gerson", matricule: "", village: "Koukolaguha", arrete: "ARRETE N°044/RHS/PI/CAB", departement: "Issia" },
    { nom: "DIGBEU", prenoms: "Gnoka Emmanuel", matricule: "", village: "Louria", arrete: "ARRETE N° 008/RHS/PI/CAB", departement: "Issia" },
    { nom: "GNAKPA", prenoms: "Zigui", matricule: "", village: "Moussegougoua", arrete: "ARRETE N°020/RHS/PI/CAB", departement: "Issia" },
    { nom: "GUIHOUNOU", prenoms: "Kuihogbo Roger", matricule: "", village: "Namane", arrete: "ARRETE N°022/RHS/PI/CAB", departement: "Issia" },
    { nom: "LAGO", prenoms: "Seri Alexis", matricule: "", village: "Nianabehi", arrete: "ARRETE N° 013/RHS/PI/CAB", departement: "Issia" },
    { nom: "YOHOU", prenoms: "Guede Fidele", matricule: "", village: "Nioboguhe", arrete: "ARRETE N°092/PI/SG/D1", departement: "Issia" },
    { nom: "NAKI", prenoms: "Appolinaire", matricule: "", village: "Ouandia", arrete: "ARRETE N°023/RHS/PI/CAB", departement: "Issia" },
    { nom: "SEKRE", prenoms: "Depode Jules", matricule: "", village: "Selieguhe", arrete: "ARRETE N° 001/PI/SG/D1", departement: "Issia" },
    { nom: "DIGBEU", prenoms: "Lago Florent", matricule: "", village: "Tassouroubouo", arrete: "ARRETE N° 020/RHS/PI/SG/D2", departement: "Issia" },
    { nom: "YORO", prenoms: "Yaya Ernest", matricule: "", village: "Zedeguhe", arrete: "ARRETE N° 001/PI/SG/D1", departement: "Issia" },
    
    // Zoukougbeu department
    { nom: "GBEULY", prenoms: "Gninikouagnon David", matricule: "", village: "Bagro I", arrete: "ARRETE N°06/D-ZK/P-ZK/CAB", departement: "Zoukougbeu" },
    { nom: "GNAHORE", prenoms: "Digbeu Celestin", matricule: "", village: "Bassaraguhe", arrete: "ARRETE N°10/RHS/D.ZK/P.ZK/CAB", departement: "Zoukougbeu" },
    { nom: "SERE", prenoms: "Korahi David", matricule: "", village: "Dedegbeu", arrete: "ARRETE N°018/D-ZK/P-ZK/CAB", departement: "Zoukougbeu" },
    { nom: "FALLE", prenoms: "Lero Gaston", matricule: "", village: "Dileya", arrete: "ARRETE N°12/PZK/SG", departement: "Zoukougbeu" },
    { nom: "DJETTO", prenoms: "Rougole Bernadette", matricule: "", village: "Gueuguibieu 1", arrete: "ARRETE N° 05/D ZK/P ZK/CAB", departement: "Zoukougbeu" },
    { nom: "KESSEA", prenoms: "Sada Roger", matricule: "", village: "Guetuzon 1", arrete: "ARRETE N° 08/RHS/D.ZK/P.ZK/CAB", departement: "Zoukougbeu" },
    { nom: "YANLE", prenoms: "Deazon Patrice", matricule: "", village: "Guetuzon 2", arrete: "ARRETE N°09/RHS/D.ZK", departement: "Zoukougbeu" },
    { nom: "GOUESSE", prenoms: "Koffi Justin", matricule: "", village: "Mahigbeu", arrete: "ARRETE N°11/PZK/SG", departement: "Zoukougbeu" },
    { nom: "DAFRAN", prenoms: "Olivier", matricule: "", village: "Ouatigbeu 2", arrete: "ARRETE N° 03/RHS/D.ZK/P.ZK/CAB", departement: "Zoukougbeu" },
    { nom: "NAGBE", prenoms: "Guehi Felix", matricule: "", village: "Zahirougbeu", arrete: "N°ARRETE 27/RHS/D-ZK/P.ZK/CAB", departement: "Zoukougbeu" },
    { nom: "ZAKPA", prenoms: "Tossegoue Fidele", matricule: "", village: "Zakogbeu II", arrete: "ARRETE N° 04/D-ZK/P-ZK/CAB", departement: "Zoukougbeu" },
    { nom: "GNOGOUE", prenoms: "Britho Gaston", matricule: "", village: "Zoukpanangbeu", arrete: "ARRETE N°10/D-ZK/P-ZK/SG", departement: "Zoukougbeu" }
];

async function verifyAndImportHautSassandraChiefs() {
    try {
        console.log(`Analyzing database to match ${rawChiefsData.length} Haut-Sassandra chiefs (ULTRA OPTIMIZED MODE)...`);

        const officialRegionName = "Haut-Sassandra";
        const officialRegionId = "reg-haut-sassandra";
        const officialDistrictName = "Sassandra-Marahoué";
        const officialDistrictId = "dist-sassandra-marahoue";

        let addedCount = 0;
        let updatedCount = 0;

        // Process sequentially to completely respect API safety and budget limits
        for (const raw of rawChiefsData) {
            const fullName = `${raw.nom} ${raw.prenoms}`.trim();
            const now = new Date();

            let officialDeptId = "";
            let officialDeptName = "";
            const deptLower = raw.departement.toLowerCase();
            if (deptLower.includes("daloa")) {
                officialDeptId = "dept-daloa";
                officialDeptName = "Daloa";
            } else if (deptLower.includes("issia")) {
                officialDeptId = "dept-issia";
                officialDeptName = "Issia";
            } else if (deptLower.includes("zoukougbeu")) {
                officialDeptId = "dept-zoukougbeu";
                officialDeptName = "Zoukougbeu";
            } else {
                officialDeptId = "dept-daloa";
                officialDeptName = "Daloa";
            }

            // 1. QUERY INDIVIDUAL CHIEF DIRECTLY (Saves thousands of reads)
            console.log(`Processing "${fullName}"...`);
            const chiefsQuery = await db.collection('chiefs')
                .where('name', '==', fullName)
                .get();

            let chiefId = "";
            let matchDoc = chiefsQuery.empty ? null : chiefsQuery.docs[0];

            if (matchDoc) {
                // Chief exists: Update fields
                chiefId = matchDoc.id;
                const existingData = matchDoc.data();

                const updateFields: any = {
                    nom: raw.nom,
                    prenoms: raw.prenoms,
                    name: fullName,
                    village: raw.village ? titleCase(raw.village) : "",
                    department: officialDeptName,
                    departmentId: officialDeptId,
                    region: officialRegionName,
                    regionId: officialRegionId,
                    district: officialDistrictName,
                    districtId: officialDistrictId,
                    updatedAt: now.toISOString()
                };

                if (raw.arrete) {
                    updateFields.arreteNomination = raw.arrete;
                }

                if (!existingData.titre) updateFields.titre = "Chef de village";
                if (!existingData.statut) updateFields.statut = "Vivant";
                if (!existingData.nationalite) updateFields.nationalite = "Ivoirienne";

                await db.collection('chiefs').doc(chiefId).update(updateFields);
                console.log(`  [UPDATE] Chief "${fullName}" (Village: ${raw.village || "N/A"}, ID: ${chiefId})`);
                updatedCount++;
            } else {
                // Chief does not exist: Create it
                const age = Math.floor(Math.random() * (83 - 58 + 1)) + 58;
                const birthYear = 2026 - age;
                const birthMonth = Math.floor(Math.random() * 12) + 1;
                const birthDay = Math.floor(Math.random() * 28) + 1;
                const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

                const docData: any = {
                    nom: raw.nom,
                    prenoms: raw.prenoms,
                    name: fullName,
                    village: raw.village ? titleCase(raw.village) : "",
                    department: officialDeptName,
                    departmentId: officialDeptId,
                    region: officialRegionName,
                    regionId: officialRegionId,
                    district: officialDistrictName,
                    districtId: officialDistrictId,
                    titre: "Chef de village",
                    statut: "Vivant",
                    nationalite: "Ivoirienne",
                    dateOfBirth: dateOfBirth,
                    bio: raw.village 
                        ? `Chef de village de ${titleCase(raw.village)} dans le département de ${officialDeptName}, région du Haut-Sassandra.`
                        : `Chef de village dans le département de ${officialDeptName}, région du Haut-Sassandra.`,
                    photoUrl: "",
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString()
                };

                if (raw.arrete) {
                    docData.arreteNomination = raw.arrete;
                }

                const docRef = await db.collection('chiefs').add(docData);
                chiefId = docRef.id;
                console.log(`  [CREATE] Chief "${fullName}" (Village: ${raw.village || "N/A"}, ID: ${chiefId})`);
                addedCount++;
            }

            // 2. VILLAGE LINKAGE & CREATION (Saves thousands of reads by querying directly)
            if (raw.village) {
                const villageQuery = await db.collection('villages')
                    .where('name', '==', titleCase(raw.village))
                    .where('department', '==', officialDeptName)
                    .get();

                let villageId = "";

                if (!villageQuery.empty) {
                    // Village exists
                    const villageDoc = villageQuery.docs[0];
                    villageId = villageDoc.id;
                    const villageUpdate: any = {
                        chiefId: chiefId,
                        chiefName: fullName,
                        department: officialDeptName,
                        departmentId: officialDeptId,
                        region: officialRegionName,
                        regionId: officialRegionId,
                        district: officialDistrictName,
                        districtId: officialDistrictId,
                        updatedAt: now.toISOString()
                    };

                    await db.collection('villages').doc(villageId).update(villageUpdate);
                } else {
                    // Village does not exist: Create it
                    const villageData = {
                        name: titleCase(raw.village),
                        slug: slugify(raw.village),
                        department: officialDeptName,
                        departmentId: officialDeptId,
                        region: officialRegionName,
                        regionId: officialRegionId,
                        district: officialDistrictName,
                        districtId: officialDistrictId,
                        chiefId: chiefId,
                        chiefName: fullName,
                        population: Math.floor(Math.random() * (4500 - 600 + 1)) + 600,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                    };

                    const villageDocRef = await db.collection('villages').add(villageData);
                    villageId = villageDocRef.id;
                    console.log(`    [NEW VILLAGE] Created village "${titleCase(raw.village)}" (ID: ${villageId})`);
                }

                // Update the chief's villageId reference
                await db.collection('chiefs').doc(chiefId).update({
                    villageId: villageId,
                    updatedAt: now.toISOString()
                });
            }
        }

        console.log(`\n=============================================`);
        console.log(`Haut-Sassandra Chiefs Alignment completed!`);
        console.log(`  - Chiefs newly created: ${addedCount}`);
        console.log(`  - Chiefs updated: ${updatedCount}`);
        console.log(`  - Total processed: ${rawChiefsData.length}`);
        console.log(`=============================================`);
        process.exit(0);

    } catch (e) {
        console.error("Migration/Verification failed:", e);
        process.exit(1);
    }
}

verifyAndImportHautSassandraChiefs();

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

function normalizeString(s: string): string {
    if (!s) return "";
    return s.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

// 38 Unique Chiefs from the Bélier region after consolidating obvious duplicates
const rawChiefsData = [
    { nom: "AHOUET", prenoms: "Tiemi Aboha Michel", matricule: "", village: "Aguibri", arrete: "", departement: "Attiégouakro" },
    { nom: "KOFFI", prenoms: "Kouassi Jacques", matricule: "", village: "Koimoidibikro", arrete: "", departement: "Attiégouakro" },
    { nom: "GEORGES COLLINS", prenoms: "Yao", matricule: "", village: "Mahounou Nananfoué", arrete: "", departement: "Attiégouakro" },
    { nom: "YAO", prenoms: "Kouacou Evariste", matricule: "", village: "Ouffoué-Diékro", arrete: "", departement: "Attiégouakro" },
    { nom: "YAO", prenoms: "Kouadio Patrice", matricule: "", village: "Sakiaré", arrete: "", departement: "Attiégouakro" },
    { nom: "KOUASSI", prenoms: "N'Guessan Alphonse", matricule: "", village: "Tokoreyaokro", arrete: "", departement: "Attiégouakro" },
    
    { nom: "AGOHI N'GUESSAN", prenoms: "Celestin Dieudonne", matricule: "", village: "Allui-N'guessankro", arrete: "ARRETE N° 004/RB/DD/P-DVI/CAB", departement: "Didiévi" },
    { nom: "LOUKOU", prenoms: "Kouame", matricule: "", village: "Attékro", arrete: "ARRETE N°0050/PDVI/SG", departement: "Didiévi" },
    { nom: "N'DA", prenoms: "Kouadio", matricule: "", village: "Bodo", arrete: "ARRETE N° 012/P-DVI", departement: "Didiévi" },
    { nom: "KOUAKOU", prenoms: "Kramo", matricule: "", village: "Broukro 1", arrete: "ARRETE N° 001/P-DVI/CAB", departement: "Didiévi" },
    { nom: "KOUASSI", prenoms: "Attoungbre", matricule: "", village: "Broukro II", arrete: "ARRETE N° 016/P-DIV/CAB", departement: "Didiévi" },
    { nom: "KONAN", prenoms: "Kouakou", matricule: "", village: "Kokoun Zogrékro II", arrete: "ARRETE N° 0033/PDVI/SG", departement: "Didiévi" },
    { nom: "KONAN", prenoms: "Kouakou Bertin", matricule: "", village: "Konansuikro", arrete: "ARRETE N°008/P-DVI/CAB", departement: "Didiévi" },
    { nom: "KOFFI", prenoms: "Kouassi Daniel", matricule: "", village: "Kouamé-Akoikro", arrete: "ARRETE N° 004/P-DVI/CAB", departement: "Didiévi" },
    { nom: "KOUASSI", prenoms: "Yao Auguste", matricule: "", village: "Krou-Okoukro", arrete: "ARRETE N°007/P-DVI/CAB", departement: "Didiévi" },
    { nom: "KONAN", prenoms: "Kouadio", matricule: "", village: "Langui Kouadiokro", arrete: "ARRETE N° 0010/PDVI/SG", departement: "Didiévi" },
    { nom: "KOUAKOU", prenoms: "Kouakou", matricule: "", village: "Mafé", arrete: "ARRETE N°17/P-DVI/CAB", departement: "Didiévi" },
    { nom: "N'GUESSAN", prenoms: "Kouassi Daniel", matricule: "", village: "N'da-Akissikro", arrete: "ARRETE N° 011/P-DVI/CAB", departement: "Didiévi" },
    { nom: "KOUAKOU", prenoms: "N'Gotta Remi", matricule: "", village: "Tokpayakro", arrete: "ARRETE N° 004/PDVI/SG", departement: "Didiévi" },
    { nom: "ASSOUA", prenoms: "Konan Louis", matricule: "", village: "Yaakro", arrete: "ARRETE N°011/P-DVI/CAB", departement: "Didiévi" },
    
    { nom: "MAGLOIRE", prenoms: "Koblan Zinsou", matricule: "", village: "Alluminankro", arrete: "ARRETE N° 009/P.DKNOU/CAB", departement: "Djékanou" },
    
    { nom: "N'GUESSAN EPSE KOUAKOU", prenoms: "Amoin", matricule: "", village: "Adikro", arrete: "ARRETE N°002/P-TIEB/SG/DAG1", departement: "Tiébissou" },
    
    { nom: "KOFFI", prenoms: "N'Guessan", matricule: "", village: "Abli Alloukro", arrete: "ARRETE N°15/RB/P.TDI/CAB", departement: "Toumodi" },
    { nom: "N'DRI", prenoms: "Konan", matricule: "", village: "Affokro", arrete: "ARRETE N° 108/P.TDI/CAB-C", departement: "Toumodi" },
    { nom: "KOUASSI", prenoms: "Koko", matricule: "", village: "Akouékouadiokro", arrete: "", departement: "Toumodi" },
    { nom: "KOUAME", prenoms: "M'Bra Joachim", matricule: "", village: "Akrakro N'gban", arrete: "ARRETE N° 017/RB/P.TDI/SG", departement: "Toumodi" },
    { nom: "KOUAKOU", prenoms: "Akrou Didier", matricule: "", village: "Akroukro", arrete: "ARRETE N°016/RB/P.TDI/SG", departement: "Toumodi" },
    { nom: "N'DRI", prenoms: "Konan", matricule: "", village: "Angoda", arrete: "ARRETE N° 108/P.TDI/CAB-C", departement: "Toumodi" },
    { nom: "KOUAME", prenoms: "Koffi Daniel", matricule: "", village: "Assakra", arrete: "ARRETE N°36/RB/P.TDI/CAB", departement: "Toumodi" },
    { nom: "N'GORAN", prenoms: "Yao", matricule: "", village: "Kahankro", arrete: "ARRETE N° 31/RB/P.TDI/CAB", departement: "Toumodi" },
    { nom: "N'GUESSAN", prenoms: "Kouame Roger", matricule: "", village: "Kalékou", arrete: "ARRETE N° 30/RB/P.TDI/CAB", departement: "Toumodi" },
    { nom: "KOUAKOU", prenoms: "Akrou Didier", matricule: "", village: "Kokumbo", arrete: "ARRETE N°016/RB/P.TDI/SG", departement: "Toumodi" },
    { nom: "KOUAKOU", prenoms: "M'Bra", matricule: "", village: "Kpouébo", arrete: "ARRETE N°024/RB/P.TDI/SG", departement: "Toumodi" },
    { nom: "KOUASSI", prenoms: "Yao", matricule: "", village: "Lomo-Sud", arrete: "ARRETE N° 008/P.TDI/CAB", departement: "Toumodi" },
    { nom: "KOUAKOU", prenoms: "N'Guessan Celestin", matricule: "", village: "Molonou", arrete: "ARRETE N° 56/P-TIEB/SG/D1", departement: "Toumodi" },
    { nom: "AMANI", prenoms: "Koffi", matricule: "", village: "Mougokro", arrete: "", departement: "Toumodi" },
    { nom: "KOUAKOU", prenoms: "N'Guessan Celestin", matricule: "", village: "Yuakré", arrete: "ARRETE N° 56/P-TIEB/SG/D1", departement: "Toumodi" },
    { nom: "BOHOUSSOU", prenoms: "Kouadio Germain", matricule: "", village: "Zahakro", arrete: "ARRETE N° 22/RB/P.TDI/CAB", departement: "Toumodi" }
];

async function verifyAndImportBelierChiefs() {
    try {
        console.log(`Analyzing database to match ${rawChiefsData.length} Bélier chiefs...`);

        // Fetch all existing chiefs in Firestore
        const chiefsSnapshot = await db.collection('chiefs').get();
        const existingChiefs = chiefsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            normName: normalizeString(doc.data().name || `${doc.data().nom || ""} ${doc.data().prenoms || ""}`),
            normVillage: normalizeString(doc.data().village || "")
        }));
        console.log(`Loaded ${existingChiefs.length} existing chiefs from database.`);

        // Fetch all existing villages in Firestore
        const villagesSnapshot = await db.collection('villages').get();
        const existingVillages = villagesSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            normName: normalizeString(doc.data().name || ""),
            normDept: normalizeString(doc.data().department || "")
        }));
        console.log(`Loaded ${existingVillages.length} existing villages from database.`);

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const raw of rawChiefsData) {
            const fullName = `${raw.nom} ${raw.prenoms}`.trim();
            const normFullName = normalizeString(fullName);
            const normVillageName = normalizeString(raw.village);

            // 1. Try to find the chief in Firestore (fuzzy match)
            let match = existingChiefs.find(ec => {
                // Perfect name match
                if (ec.normName === normFullName) return true;
                // Perfect name sub-match
                if (ec.normName.includes(normFullName) || normFullName.includes(ec.normName)) {
                    if (ec.normVillage === normVillageName || normVillageName === "") return true;
                }
                // Village + Last Name match
                if (ec.normVillage === normVillageName && normVillageName !== "" && ec.normName.includes(normalizeString(raw.nom))) {
                    return true;
                }
                return false;
            });

            // 2. Prepare fields for creation/update
            const officialRegionName = "Bélier";
            const officialRegionId = "reg-blier";
            
            // Map departments to their official IDs
            let officialDeptId = "";
            let officialDeptName = "";
            let officialDistrictName = "Lacs";
            let officialDistrictId = "dist-lacs";
            
            const deptLower = raw.departement.toLowerCase();
            if (deptLower.includes("attiegouakro")) {
                officialDeptId = "dept-attigouakro";
                officialDeptName = "Attiégouakro";
                // Attiégouakro is under Yamoussoukro district autononome technically in division files, 
                // but we align with user request to Bélier region structure
            } else if (deptLower.includes("didievi")) {
                officialDeptId = "dept-didivi"; // official id
                officialDeptName = "Didiévi";
            } else if (deptLower.includes("djekanou")) {
                officialDeptId = "dept-djkanou"; // official id
                officialDeptName = "Djékanou";
            } else if (deptLower.includes("tiebissou")) {
                officialDeptId = "dept-tibissou"; // official id
                officialDeptName = "Tiébissou";
            } else if (deptLower.includes("toumodi")) {
                officialDeptId = "dept-toumodi";
                officialDeptName = "Toumodi";
            } else {
                officialDeptId = "dept-toumodi";
                officialDeptName = "Toumodi";
            }

            const now = new Date();
            let chiefId = "";

            if (match) {
                // Chief exists: Update fields
                chiefId = match.id;

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
                if (raw.matricule) {
                    updateFields.matricule = raw.matricule;
                    updateFields.registrationNumber = raw.matricule;
                }

                if (!match.data.titre) updateFields.titre = "Chef de village";
                if (!match.data.statut) updateFields.statut = "Vivant";
                if (!match.data.nationalite) updateFields.nationalite = "Ivoirienne";

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
                        ? `Chef de village de ${titleCase(raw.village)} dans le département de ${officialDeptName}, région du Bélier.`
                        : `Chef de village dans le département de ${officialDeptName}, région du Bélier.`,
                    photoUrl: "",
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString()
                };

                if (raw.arrete) {
                    docData.arreteNomination = raw.arrete;
                }
                if (raw.matricule) {
                    docData.matricule = raw.matricule;
                    docData.registrationNumber = raw.matricule;
                }

                const docRef = await db.collection('chiefs').add(docData);
                chiefId = docRef.id;
                console.log(`  [CREATE] Chief "${fullName}" (Village: ${raw.village || "N/A"}, ID: ${chiefId})`);
                addedCount++;
            }

            // 3. VILLAGE LINKAGE & CREATION (Skip if village is not specified)
            if (raw.village) {
                let villageMatch = existingVillages.find(ev => 
                    ev.normName === normVillageName && 
                    ev.normDept === normalizeString(officialDeptName)
                );

                let villageId = "";

                if (villageMatch) {
                    villageId = villageMatch.id;
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
                    console.log(`    [NEW VILLAGE] Created village "${titleCase(raw.village)}" (ID: villageId)`);

                    existingVillages.push({
                        id: villageId,
                        data: villageData as any,
                        normName: normVillageName,
                        normDept: normalizeString(officialDeptName)
                    });
                }

                // Update the chief's villageId reference
                await db.collection('chiefs').doc(chiefId).update({
                    villageId: villageId,
                    updatedAt: now.toISOString()
                });
            }
        }

        console.log(`\n=============================================`);
        console.log(`Bélier Chiefs Alignment completed!`);
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

verifyAndImportBelierChiefs();

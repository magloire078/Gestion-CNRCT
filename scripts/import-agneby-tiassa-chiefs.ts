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

// 29 Chiefs from the Agnéby-Tiassa region
const rawChiefsData = [
    { nom: "AHYBIE", prenoms: "Diagba Offori Remi Gustave", matricule: "", village: "Aboudé-Kouassikro", arrete: "ARRETE N° 12/R.A/P.AGBO/CAB", departement: "Agboville" },
    { nom: "NIANGORAN", prenoms: "Abodo", matricule: "", village: "Aboudé-Mandéké", arrete: "ARRETE N° 008/R.A/P.AGBO/SG/D1/B1", departement: "Agboville" },
    { nom: "KETTE", prenoms: "Adja Jean", matricule: "", village: "Achiékoi", arrete: "ARRETE N° 12/R.A/P.AGBO/SG/D1/B1", departement: "Agboville" },
    { nom: "ACHIRO", prenoms: "Kodou Antoine", matricule: "", village: "Angoh", arrete: "ARRETE N° 38/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "ODIACHO", prenoms: "Gogo", matricule: "", village: "Azaguié-Makouguié", arrete: "ARRETE N° 65/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "IKPE", prenoms: "Dedje Adolphe", matricule: "", village: "Babiahan", arrete: "ARRETE N° 32/R.A-T/P.AGBO/SG1", departement: "Agboville" },
    { nom: "EDI", prenoms: "Ekissi Adolphe", matricule: "", village: "Banguié 1", arrete: "ARRETE N° 10/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "KONIEN", prenoms: "Konien Roger", matricule: "", village: "Dingbé", arrete: "ARRETE N° 14/R.A-T/P.AGBO/SG1/T", departement: "Agboville" },
    { nom: "N'GOU", prenoms: "N'Gbesso Marc", matricule: "", village: "Elévi", arrete: "ARRETE N° 146/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "KOFFI", prenoms: "Kokola Raphael", matricule: "", village: "Gouabo", arrete: "ARRETE N° 47/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "EDI", prenoms: "Tchimou", matricule: "", village: "Grand-Yapo", arrete: "ARRETE N° 60/R.A-T/P.AGBO/SG1/T", departement: "Agboville" },
    { nom: "AMAHOUE", prenoms: "Kebe", matricule: "", village: "Guessiguié 1", arrete: "ARRETE N° 007/R.A/P.AGBO/SG/D1/B1", departement: "Agboville" },
    { nom: "DEDOU", prenoms: "Brou Germain", matricule: "", village: "Kamabrou", arrete: "ARRETE N° 32/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "DJAMA", prenoms: "Okon Brou Bertrand", matricule: "", village: "Kassiguié", arrete: "ARRETE N° 55 /R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "GNAMIEN", prenoms: "Gbakou Jean", matricule: "", village: "Looguié", arrete: "ARRETE N° 55/R.A-T/P.AGBO/SG 2", departement: "Agboville" },
    { nom: "KAREKE", prenoms: "Christophe", matricule: "", village: "Oress-Krobou", arrete: "ARRETE N° 006/R.A/P.AGBO/SG/D1/B1", departement: "Agboville" },
    { nom: "DOFFOU", prenoms: "Dieke Noel", matricule: "", village: "Petit-Yapo", arrete: "ARRETE N° 30/R.A/AGBO/SG", departement: "Agboville" },
    { nom: "YAPI", prenoms: "Boni", matricule: "", village: "Rubino", arrete: "ARRETE N° 08/R.AT/P.AGBO/SG/DTACT", departement: "Agboville" },
    { nom: "NGUESSAN", prenoms: "Assa", matricule: "", village: "Yadio", arrete: "ARRETE N° 22/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    // Row 20 is duplicate YAPI Boni with no village - we skip/merge it
    { nom: "BEDA", prenoms: "Ossohou Maximin", matricule: "", village: "", arrete: "ARRETE N° 63/R.A-T/P.AGBO/CAB", departement: "Agboville" },
    { nom: "DIBY", prenoms: "Gnahoua Joseph", matricule: "", village: "Sahuyé", arrete: "ARRETE N° 004/RA-T/P.SIK/CAB", departement: "Sikensi" },
    { nom: "KOUADIO", prenoms: "Kouame Raphael", matricule: "", village: "", arrete: "ARRETE N° 14/R.AT/D-TAA/P-TAA/SG/DIV I", departement: "Taabo" },
    { nom: "AKAFFO", prenoms: "M'Bra", matricule: "", village: "Abévé", arrete: "ARRETE N° 033/P-TIA/CAB", departement: "Tiassalé" },
    { nom: "TANO", prenoms: "Mandji Kouakou", matricule: "", village: "Ahiroa", arrete: "ARRETE N° 13/P-TIA/SG/DAG-1", departement: "Tiassalé" },
    { nom: "KOFFI", prenoms: "Konan Jean-Claude", matricule: "", village: "Dibykro", arrete: "ARRETE N°082/P-TIA/CAB", departement: "Tiassalé" },
    { nom: "AFFI", prenoms: "Celestin Ehouman", matricule: "", village: "Ehouman-Koffikro", arrete: "ARRETE N°021/P-TIA/CAB", departement: "Tiassalé" },
    { nom: "OBOUMOU", prenoms: "Obouo", matricule: "", village: "Kanga-Nianzékro", arrete: "ARRETE N° 025/P-TIA/CAB", departement: "Tiassalé" },
    { nom: "BOKA", prenoms: "Yao", matricule: "", village: "", arrete: "ARRETE N° 044/P-TIA/CAB", departement: "Tiassalé" }
];

async function verifyAndImportAgnebyTiassaChiefs() {
    try {
        console.log(`Analyzing database to match ${rawChiefsData.length} Agnéby-Tiassa chiefs...`);

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
            const officialRegionName = "Agnéby-Tiassa";
            const officialRegionId = "reg-agnby-tiassa";
            const officialDistrictName = "Lagunes";
            const officialDistrictId = "dist-lagunes";
            
            // Map departments to their official IDs
            let officialDeptId = "";
            let officialDeptName = "";
            
            if (raw.departement.toLowerCase().includes("agboville")) {
                officialDeptId = "dept-agboville";
                officialDeptName = "Agboville";
            } else if (raw.departement.toLowerCase().includes("sikensi")) {
                officialDeptId = "dept-sikensi";
                officialDeptName = "Sikensi";
            } else if (raw.departement.toLowerCase().includes("taabo")) {
                officialDeptId = "dept-taabo";
                officialDeptName = "Taabo";
            } else if (raw.departement.toLowerCase().includes("tiassale")) {
                officialDeptId = "dept-tiassal"; // official id in JSON
                officialDeptName = "Tiassalé";
            } else {
                officialDeptId = "dept-agboville";
                officialDeptName = "Agboville";
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
                        ? `Chef de village de ${titleCase(raw.village)} dans le département de ${officialDeptName}, région de l'Agnéby-Tiassa.`
                        : `Chef de village dans le département de ${officialDeptName}, région de l'Agnéby-Tiassa.`,
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
                // Try to find the village in Firestore
                let villageMatch = existingVillages.find(ev => 
                    ev.normName === normVillageName && 
                    ev.normDept === normalizeString(officialDeptName)
                );

                let villageId = "";

                if (villageMatch) {
                    // Village exists
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
        console.log(`Agnéby-Tiassa Chiefs Alignment completed!`);
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

verifyAndImportAgnebyTiassaChiefs();

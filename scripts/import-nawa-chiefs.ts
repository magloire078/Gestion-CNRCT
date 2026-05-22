import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const adminDb = admin.firestore();

// Helper to slugify
function slugify(text: string): string {
    if (!text) return "";
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const rawChiefs = [
    { name: "GBAKA DAKOURI GERMAIN", title: "CHEF DE VILLAGE", village: "BAKADOU", bio: "Arrêté N°69/P-GYO/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "OPELY ZADI ABEL", title: "CHEF DE VILLAGE", village: "PETIGOA", bio: "Arrêté N°09/PS/SG", department: "SOUBRE", region: "NAWA" },
    { name: "KOUASSI LABA ETIENNE", title: "CHEF DE VILLAGE", village: "BAKAYO", bio: "Arrêté N°24/6GYO/SG", department: "SASSANDRA", region: "NAWA" },
    { name: "AKO YAKAI", title: "CHEF DE VILLAGE", village: "BALEKRO", bio: "Arrêté N°48/PS/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "GBALE TAGBA", title: "CHEF DE VILLAGE", village: "BOBOUO 1", bio: "Arrêté N°54/PS/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "BEHA BABO CLAUDE", title: "CHEF DE VILLAGE", village: "BOBOUO 2", bio: "Arrêté N°05/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "LAGOGNAZE ROBERT", title: "CHEF DE VILLAGE", village: "ZOUGOUZOA", bio: "Arrêté N°144/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "GNALI GNAKOURI MICHEL", title: "CHEF DE VILLAGE", village: "BRETIHIO", bio: "Arrêté N°02/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "NADO TOUOLI ROMARIC", title: "CHEF DE VILLAGE", village: "DABOUYO", bio: "Arrêté N°25/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "GBOGOU JEAN JUSTIN", title: "CHEF DE VILLAGE", village: "DAGOUAYO", bio: "Arrêté N°27/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "TEGBO SERI RENE", title: "CHEF DE VILLAGE", village: "GODIAYO 1", bio: "Arrêté N°23/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "ZAMA SAKI AIME", title: "CHEF DE VILLAGE", village: "GODIAYO 2", bio: "Arrêté N°07/P-GYS/SG", department: "GUEYO", region: "NAWA" },
    { name: "GNABE KAKE THOMAS", title: "CHEF DE VILLAGE", village: "KOSSOYO", bio: "Arrêté N°14/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "AHIPO RABE WILIAME", title: "CHEF DE VILLAGE", village: "LAHOURIDOU 1", bio: "Arrêté N°10/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "AKONOU ZAGRI ALFRED", title: "CHEF DE VILLAGE", village: "LAHOURIDOU 2", bio: "Arrêté N°09/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "DOUABA GNADOU ALAIN", title: "CHEF DE VILLAGE", village: "NIOROUHIO", bio: "Arrêté N°001/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "KEUDO DIBA BONIFACE", title: "CHEF DE VILLAGE", village: "NIOROUHIO", bio: "Arrêté N°46/PS/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "INAGBE ABOKOUA JEAN CLAUDE", title: "CHEF DE VILLAGE", village: "TAGBAYO 1", bio: "Arrêté N°10/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "YOUOTO SERI JEAN CLAUDE", title: "CHEF DE VILLAGE", village: "TAGBAYO 2", bio: "Arrêté N°57/PS/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "KOUASSI BOBO EUGENE", title: "CHEF DE VILLAGE", village: "TCHEDJELET", bio: "Arrêté N°26/P-GYO/SG", department: "SASSANDRA", region: "NAWA" },
    { name: "DABE DOUDOU HENRI", title: "CHEF DE VILLAGE", village: "ZIWAYO 2", bio: "Arrêté N°50/PS/CAB", department: "SASSANDRA", region: "NAWA" },
    { name: "INEFE VAKA RAYMOND", title: "CHEF DE VILLAGE", village: "DABOUYO", bio: "Arrêté N°17/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "GRAGBA ZOHOURI", title: "CHEF DE VILLAGE", village: "BODOUYO-BLOC", bio: "Arrêté N°06/P-GYO/SG", department: "GUEYO", region: "NAWA" },
    { name: "DEGRE ETIENNE", title: "CHEF DE VILLAGE", village: "GREBOUO 1", bio: "Arrêté N°055/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "RABE GOPOH LUDOVIC", title: "CHEF DE VILLAGE", village: "GREBOUO 2", bio: "Arrêté N°053/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "GBALLE ZADOU JEAN PAUL", title: "CHEF DE VILLAGE", village: "OKROUYO", bio: "Arrêté N°49/PS/SG/D1", department: "SOUBRE", region: "NAWA" },
    { name: "OKPOH GBOZE THEODORE", title: "CHEF DE VILLAGE", village: "KOUDOUYO", bio: "Arrêté N°14/PS/CAB", department: "SOUBRE", region: "NAWA" },
    { name: "ZADI BOA BERNARD", title: "CHEF DE VILLAGE", village: "KPADA", bio: "Arrêté N°060/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "DAGROU GUY", title: "CHEF DE VILLAGE", village: "MABEHIRI 1", bio: "Arrêté N°056/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "SAKI GNAPO FERDINAND", title: "CHEF DE VILLAGE", village: "MABEHIRI 2", bio: "Arrêté N°059/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "GBEYERE KOUADIO PAUL", title: "CHEF DE VILLAGE", village: "OTTAWA", bio: "Arrêté N°048/RN/DS/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "DEGUI RABE PIERRE", title: "CHEF DE VILLAGE", village: "GBALEBOUO", bio: "Arrêté N°061/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "BLADI DJAPOH RAPHAEL", title: "CHEF DE VILLAGE", village: "BOGREKO", bio: "Arrêté N°058/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "OSSOUM ARSENE", title: "CHEF DE VILLAGE", village: "DOBOUO", bio: "Arrêté N°031/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "AGUIBAHI LAGO VICTORIEN", title: "CHEF DE VILLAGE", village: "GADAGO", bio: "Arrêté N°038/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "MAGUI JEAN CLAUDE", title: "CHEF DE VILLAGE", village: "GABAGUHE", bio: "Arrêté N°34/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "HONAYORE KIPLE MATHIEU", title: "CHEF DE VILLAGE", village: "KOREGUHE", bio: "Arrêté N°055/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "BAHI DIGBEU MAMBERT", title: "CHEF DE VILLAGE", village: "BLESSEOUA", bio: "Arrêté N°008/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "SERI LIYIRI", title: "CHEF DE VILLAGE", village: "OUREYO", bio: "Arrêté N°009/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "DOUKORE BOLOU SAMMUEL", title: "CHEF DE VILLAGE", village: "GBALEVILLE", bio: "Arrêté N°042/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "LOGNON BOUAZO LAMBERT", title: "CHEF DE VILLAGE", village: "MAVOU", bio: "Arrêté N°051/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "SOSSE ALFRED", title: "CHEF DE VILLAGE", village: "GBISSO", bio: "Arrêté N°01/PS-CAB", department: "SOUBRE", region: "NAWA" }, // Fixed department SOUBER
    { name: "TETI ZADI BERTIN", title: "CHEF DE VILLAGE", village: "ZAKOEOUA", bio: "Arrêté N°68/PS/CAB", department: "SOUBRE", region: "NAWA" },
    { name: "BOZA GOBLE DENIS", title: "CHEF DE VILLAGE", village: "GBALEGUHE", bio: "Arrêté N°004/PS/SG/D1", department: "SOUBRE", region: "NAWA" },
    { name: "DAGO TAPE JEAN CLAUDE", title: "CHEF DE VILLAGE", village: "KIPIRI", bio: "Arrêté N°062/PS-CAB", department: "SOUBRE", region: "NAWA" },
    { name: "ZOH GBALE JOACHIM", title: "CHEF DE VILLAGE", village: "GBAZOA", bio: "Arrêté N°006/PS-CAB", department: "SOUBRE", region: "NAWA" }
];

async function seedChiefsNawa() {
    console.log("Starting Chiefs Seeding for NAWA...");
    
    // Attempt to match the village with the exact sub-prefecture if it exists in the 'villages' collection
    const villagesSnap = await adminDb.collection("villages")
                                .where("region", "==", "Nawa")
                                .get();
    
    const villageLookup: Record<string, string> = {}; // villageName (slugified) -> subPrefecture
    villagesSnap.forEach(snap => {
        const v = snap.data();
        if (v.name && v.subPrefecture) {
            villageLookup[slugify(v.name)] = v.subPrefecture;
        }
    });

    const batch = adminDb.batch();
    const chiefsCollection = adminDb.collection("chiefs");
    
    let addedCount = 0;

    for (const raw of rawChiefs) {
        // Find Region ID
        const rId = `reg-${slugify(raw.region)}`;

        // Find Department ID
        const dId = `dept-${slugify(raw.department)}`;
        
        // Find SubPrefecture ID based on village lookup, or default to central sub-prefecture of the department
        let spName = raw.department; // default to department name
        const vSlug = slugify(raw.village);
        if (villageLookup[vSlug]) {
            spName = villageLookup[vSlug];
        } else if (raw.department === "GUEYO") {
            spName = "Guéyo";
        } else if (raw.department === "SOUBRE") {
            spName = "Soubré";
        } else if (raw.department === "SASSANDRA") {
            spName = "Sassandra";
        }

        const spId = `sp-${slugify(spName)}-c`; 
        
        // Extract First Name / Last Name
        const parts = raw.name.split(" ");
        const lastName = parts[0];
        const firstName = parts.slice(1).join(" ");

        const now = new Date().toISOString();
        const mappedChief = {
            name: raw.name,
            lastName: lastName,
            firstName: firstName,
            title: raw.title,
            role: "Chef de Village",
            village: raw.village,
            region: raw.region,
            department: raw.department,
            subPrefecture: spName.toUpperCase(),
            regionId: rId,
            departmentId: dId,
            subPrefectureId: spId,
            contact: "",
            phone: "",
            bio: raw.bio,
            status: "actif",
            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=006039&fontFamily=Arial`,
            audit: {
                createdAt: now,
                updatedAt: now
            }
        };

        const newDocRef = chiefsCollection.doc();
        batch.set(newDocRef, mappedChief);
        addedCount++;
    }

    try {
        await batch.commit();
        console.log(`Successfully added ${addedCount} NAWA chiefs to Firestore.`);
    } catch (error) {
        console.error("Error committing batch:", error);
    }
}

seedChiefsNawa().catch(console.error);

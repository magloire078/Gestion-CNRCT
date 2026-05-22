import * as fs from 'fs';
import * as path from 'path';

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
    { nom: "MEGUHE", prenoms: "SERY LEON", title: "CHEF DE VILLAGE", village: "BATEGUEDEA II", bio: "ARRETE N°20/PD/SG2", department: "Daloa", region: "Haut-Sassandra" },
    { nom: "BOMINI", prenoms: "GOGOUA GERSON", title: "CHEF DE VILLAGE", village: "KOUKOLAGUHA", bio: "ARRETE N°044/RHS/PI/CAB", department: "Issia", region: "Haut-Sassandra" },
    { nom: "DIGBEU", prenoms: "GUEDE", title: "CHEF DE VILLAGE", village: "DOBIA", bio: "ARRETE N°011/P/I/SG/D1", department: "Issia", region: "Haut-Sassandra" }
];

async function seedChiefsHautSassandra() {
    console.log("Starting Chiefs Seeding for HAUT SASSANDRA...");
    
    const batch = adminDb.batch();
    const chiefsCollection = adminDb.collection("chiefs");
    let addedCount = 0;

    for (const raw of rawChiefs) {
        const rId = `reg-${slugify(raw.region)}`;
        const dId = `dept-${slugify(raw.department)}`;
        
        // We will fallback to the department name as sub-prefecture name
        const spName = raw.department; 
        const spId = `sp-${slugify(spName)}-c`; 
        
        const now = new Date().toISOString();
        const mappedChief = {
            name: `${raw.nom} ${raw.prenoms}`,
            lastName: raw.nom,
            firstName: raw.prenoms,
            title: raw.title,
            role: "Chef de Village",
            village: raw.village,
            region: raw.region,
            department: raw.department,
            subPrefecture: spName,
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
        console.log(`Successfully added ${addedCount} Haut-Sassandra chiefs to Firestore.`);
    } catch (error) {
        console.error("Error committing batch:", error);
    }
}

seedChiefsHautSassandra().catch(console.error);

// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

// Load env
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

const db = admin.firestore();

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function seedVillages() {
    console.log("Loading static data...");
    
    // Read files
    const districtsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'districts.json'), 'utf8'));
    const regionsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'regions.json'), 'utf8'));
    const deptsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'departements.json'), 'utf8'));
    const spData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sous_prefectures.json'), 'utf8'));

    // Create maps for quick lookup
    const distMap = new Map(districtsData.map((d: any) => [d.id, d.nom]));
    const regMap = new Map(regionsData.map((r: any) => [r.id, { nom: r.nom, districtId: r.district_id }]));
    const deptMap = new Map(deptsData.map((d: any) => [d.id, { nom: d.nom, regionId: d.region_id }]));

    console.log("Gathering all villages from sub-prefectures...");
    let villagesToSeed: any[] = [];
    
    for (const sp of spData) {
        if (!sp.localites || !Array.isArray(sp.localites)) continue;
        
        // Resolve hierarchy names
        const dept = deptMap.get(sp.departement_id);
        if (!dept) continue;
        
        const reg = regMap.get(dept.regionId);
        if (!reg) continue;
        
        const distName = distMap.get(reg.districtId) || "";

        for (const locName of sp.localites) {
            // Skip placeholders
            if (locName.includes("(Aucun village") || !locName.trim()) continue;

            const villageDoc = {
                name: locName.trim(),
                subPrefecture: sp.nom,
                department: dept.nom,
                region: reg.nom,
                district: distName,
                subPrefectureId: sp.id,
                departmentId: sp.departement_id,
                regionId: dept.regionId,
                districtId: reg.districtId,
                hasElectricity: false,
                hasWater: false,
                hasHealthCenter: false,
                hasSchool: false,
                hasMarket: false,
                hasMosque: false,
                hasChurch: false,
                developmentScore: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            villagesToSeed.push(villageDoc);
        }
    }

    console.log(`Found ${villagesToSeed.length} villages to seed. Starting batch operations...`);
    
    const batchSize = 400; // max 500 per batch in Firestore
    for (let i = 0; i < villagesToSeed.length; i += batchSize) {
        const batch = db.batch();
        const chunk = villagesToSeed.slice(i, i + batchSize);
        
        for (const village of chunk) {
            const newRef = db.collection('villages').doc();
            batch.set(newRef, village);
        }
        
        await batch.commit();
        console.log(`Committed batch ${Math.floor(i / batchSize) + 1} (${chunk.length} villages)`);
    }

    console.log("All villages successfully seeded into the `villages` collection!");
}

seedVillages().catch(console.error);

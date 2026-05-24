const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

if (!admin.apps.length) {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.substring(1, key.length - 1);
    }
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(key)) });
}

const db = admin.firestore();

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

async function resetSoubre() {
    console.log("Fetching all villages...");
    const snap = await db.collection('villages').get();
    
    let toDelete = [];
    snap.forEach(doc => {
        const v = doc.data();
        const d = (v.department || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (d === 'SOUBRE') {
            toDelete.push(doc.ref);
        }
    });

    console.log(`Deleting ${toDelete.length} old Soubré villages...`);
    const batchDelete = db.batch();
    for (const ref of toDelete) {
        batchDelete.delete(ref);
    }
    if (toDelete.length > 0) {
        await batchDelete.commit();
        console.log("Deletion complete.");
    }

    console.log("Loading official JSON data to recreate Soubré...");
    const districtsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'districts.json'), 'utf8'));
    const regionsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'regions.json'), 'utf8'));
    const deptsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'departements.json'), 'utf8'));
    const spData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sous_prefectures.json'), 'utf8'));

    const distMap = new Map(districtsData.map(d => [d.id, d.nom]));
    const regMap = new Map(regionsData.map(r => [r.id, { nom: r.nom, districtId: r.district_id }]));
    const deptMap = new Map(deptsData.map(d => [d.id, { nom: d.nom, regionId: d.region_id }]));

    let soubreDeptId = null;
    let soubreRegNom = null;
    let soubreDistNom = null;
    
    // find SOUBRE department ID
    for (const d of deptsData) {
        const n = d.nom.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (n === 'SOUBRE') {
            soubreDeptId = d.id;
            const reg = regMap.get(d.region_id);
            soubreRegNom = reg.nom;
            soubreDistNom = distMap.get(reg.districtId);
            break;
        }
    }

    if (!soubreDeptId) {
        console.log("Could not find SOUBRE in departements.json");
        return;
    }

    const batchCreate = db.batch();
    let count = 0;

    for (const sp of spData) {
        if (sp.departement_id === soubreDeptId && sp.localites) {
            for (const loc of sp.localites) {
                if (loc.includes("(Aucun village") || !loc.trim()) continue;

                const vData = {
                    name: loc.trim(),
                    subPrefecture: sp.nom,
                    department: "Soubré",
                    region: soubreRegNom,
                    district: soubreDistNom,
                    subPrefectureId: sp.id,
                    departmentId: soubreDeptId,
                    regionId: deptsData.find(d => d.id === soubreDeptId).region_id,
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

                const ref = db.collection('villages').doc();
                batchCreate.set(ref, vData);
                count++;
            }
        }
    }

    if (count > 0) {
        await batchCreate.commit();
        console.log(`Recreated ${count} official villages for Soubré!`);
    } else {
        console.log("No villages found to recreate for Soubre?");
    }
}

resetSoubre().then(() => process.exit(0)).catch(console.error);

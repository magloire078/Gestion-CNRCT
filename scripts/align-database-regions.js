const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load env variables
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

// Initialize Firebase Admin
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
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

function normalizeString(s) {
    if (!s) return "";
    return s.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric
}

async function alignRegions() {
    try {
        console.log("Loading official geographical JSON files...");
        const deptsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/departements.json'), 'utf8'));
        const regionsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/regions.json'), 'utf8'));
        const districtsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/districts.json'), 'utf8'));

        console.log("Building geographical mapping indexing...");
        const deptMap = {};
        for (const d of deptsData) {
            deptMap[normalizeString(d.nom)] = {
                id: d.id,
                name: d.nom,
                regionId: d.region_id
            };
        }

        const regionMap = {};
        for (const r of regionsData) {
            regionMap[r.id] = {
                id: r.id,
                name: r.nom,
                districtId: r.district_id
            };
        }

        const districtMap = {};
        for (const dist of districtsData) {
            districtMap[dist.id] = dist.nom;
        }

        console.log("\n=================== 1. VILLAGES ALIGNMENT ===================");
        const villagesSnapshot = await db.collection('villages').get();
        console.log(`Analyzing ${villagesSnapshot.size} villages in database...`);
        let villageUpdates = 0;
        let villageBatch = db.batch();
        let villageBatchCount = 0;

        for (const doc of villagesSnapshot.docs) {
            const data = doc.data();
            const docId = doc.id;
            const deptName = data.department;

            if (!deptName) {
                console.log(`  [SKIP] Village "${data.name}" has no department defined.`);
                continue;
            }

            const normDept = normalizeString(deptName);
            const officialDept = deptMap[normDept];

            if (!officialDept) {
                console.log(`  [WARN] Village "${data.name}" has unknown department "${deptName}".`);
                continue;
            }

            const officialRegion = regionMap[officialDept.regionId];
            if (!officialRegion) {
                console.log(`  [WARN] Unknown region ID "${officialDept.regionId}" for department "${deptName}".`);
                continue;
            }

            const officialDistrictName = districtMap[officialRegion.districtId] || "";

            const needsUpdate = 
                data.region !== officialRegion.name ||
                data.regionId !== officialRegion.id ||
                data.departmentId !== officialDept.id ||
                (data.district && data.district !== officialDistrictName) ||
                (data.districtId && data.districtId !== officialRegion.districtId);

            if (needsUpdate) {
                console.log(`  [UPDATE] Village "${data.name}" (${deptName}):`);
                if (data.region !== officialRegion.name) {
                    console.log(`    - Region: "${data.region}" -> "${officialRegion.name}"`);
                }
                if (data.regionId !== officialRegion.id) {
                    console.log(`    - Region ID: "${data.regionId}" -> "${officialRegion.id}"`);
                }
                if (data.departmentId !== officialDept.id) {
                    console.log(`    - Dept ID: "${data.departmentId}" -> "${officialDept.id}"`);
                }
                if (data.district !== officialDistrictName) {
                    console.log(`    - District: "${data.district}" -> "${officialDistrictName}"`);
                }

                const updateFields = {
                    region: officialRegion.name,
                    regionId: officialRegion.id,
                    departmentId: officialDept.id,
                    updatedAt: new Date().toISOString()
                };

                if (data.district !== undefined || officialDistrictName) {
                    updateFields.district = officialDistrictName;
                }
                if (data.districtId !== undefined || officialRegion.districtId) {
                    updateFields.districtId = officialRegion.districtId;
                }

                const docRef = db.collection('villages').doc(docId);
                villageBatch.update(docRef, updateFields);
                villageUpdates++;
                villageBatchCount++;

                if (villageBatchCount === 500) {
                    console.log(`  [BATCH] Committing batch of 500 villages...`);
                    await villageBatch.commit();
                    villageBatch = db.batch();
                    villageBatchCount = 0;
                }
            }
        }

        if (villageBatchCount > 0) {
            console.log(`  [BATCH] Committing final batch of ${villageBatchCount} villages...`);
            await villageBatch.commit();
        }
        console.log(`Completed village alignments. Updated ${villageUpdates} villages.`);

        console.log("\n=================== 2. CHIEFS ALIGNMENT ===================");
        const chiefsSnapshot = await db.collection('chiefs').get();
        console.log(`Analyzing ${chiefsSnapshot.size} chiefs in database...`);
        let chiefUpdates = 0;
        let chiefBatch = db.batch();
        let chiefBatchCount = 0;

        for (const doc of chiefsSnapshot.docs) {
            const data = doc.data();
            const docId = doc.id;
            const deptName = data.department;

            if (!deptName) {
                console.log(`  [SKIP] Chief "${data.name}" has no department defined.`);
                continue;
            }

            const normDept = normalizeString(deptName);
            const officialDept = deptMap[normDept];

            if (!officialDept) {
                console.log(`  [WARN] Chief "${data.name}" has unknown department "${deptName}".`);
                continue;
            }

            const officialRegion = regionMap[officialDept.regionId];
            if (!officialRegion) {
                console.log(`  [WARN] Unknown region ID "${officialDept.regionId}" for department "${deptName}".`);
                continue;
            }

            const officialDistrictName = districtMap[officialRegion.districtId] || "";

            const needsUpdate = 
                data.region !== officialRegion.name ||
                data.regionId !== officialRegion.id ||
                data.departmentId !== officialDept.id ||
                (data.district && data.district !== officialDistrictName) ||
                (data.districtId && data.districtId !== officialRegion.districtId);

            if (needsUpdate) {
                console.log(`  [UPDATE] Chief "${data.name}" (${deptName}):`);
                if (data.region !== officialRegion.name) {
                    console.log(`    - Region: "${data.region}" -> "${officialRegion.name}"`);
                }
                if (data.regionId !== officialRegion.id) {
                    console.log(`    - Region ID: "${data.regionId}" -> "${officialRegion.id}"`);
                }
                if (data.departmentId !== officialDept.id) {
                    console.log(`    - Dept ID: "${data.departmentId}" -> "${officialDept.id}"`);
                }

                const updateFields = {
                    region: officialRegion.name,
                    regionId: officialRegion.id,
                    departmentId: officialDept.id,
                    updatedAt: new Date().toISOString()
                };

                if (data.district !== undefined || officialDistrictName) {
                    updateFields.district = officialDistrictName;
                }
                if (data.districtId !== undefined || officialRegion.districtId) {
                    updateFields.districtId = officialRegion.districtId;
                }

                // Also update region reference in bio if applicable
                if (data.bio && typeof data.bio === 'string' && data.region && data.region !== officialRegion.name) {
                    const oldRegionRegex = new RegExp(data.region, 'g');
                    const newBio = data.bio.replace(oldRegionRegex, officialRegion.name);
                    if (newBio !== data.bio) {
                        console.log(`    - Bio: updated region reference to "${officialRegion.name}"`);
                        updateFields.bio = newBio;
                    }
                }

                const docRef = db.collection('chiefs').doc(docId);
                chiefBatch.update(docRef, updateFields);
                chiefUpdates++;
                chiefBatchCount++;

                if (chiefBatchCount === 500) {
                    console.log(`  [BATCH] Committing batch of 500 chiefs...`);
                    await chiefBatch.commit();
                    chiefBatch = db.batch();
                    chiefBatchCount = 0;
                }
            }
        }

        if (chiefBatchCount > 0) {
            console.log(`  [BATCH] Committing final batch of ${chiefBatchCount} chiefs...`);
            await chiefBatch.commit();
        }
        console.log(`Completed chiefs alignments. Updated ${chiefUpdates} chiefs.`);

        console.log(`\n=============================================`);
        console.log(`Geographic Alignment completed successfully!`);
        console.log(`  - Villages updated: ${villageUpdates}`);
        console.log(`  - Chiefs updated: ${chiefUpdates}`);
        console.log(`=============================================`);
        process.exit(0);

    } catch (e) {
        console.error("Migration failed:", e.message);
        process.exit(1);
    }
}

alignRegions();

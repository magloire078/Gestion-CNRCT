import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
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

async function fixAllChiefs() {
    let db: any, collection: any, getDocs: any, updateDoc: any, doc: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db; collection = fb.collection; getDocs = fb.getDocs;
        updateDoc = fb.updateDoc; doc = fb.doc;
    } catch (e: any) { console.error("Firebase import failed:", e.message); return; }

    console.log("Fetching all chiefs for data normalization...");
    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    console.log(`Working on ${chiefsSnap.docs.length} documents.`);

    let fixedCount = 0;

    for (const chefDoc of chiefsSnap.docs) {
        const data = chefDoc.data();
        const id = chefDoc.id;
        const updates: any = {};
        let needsUpdate = false;

        // Required fields per Chief type
        if (!data.name) {
            updates.name = (data.lastName && data.firstName) ? `${data.lastName} ${data.firstName}` : "Chef Inconnu";
            needsUpdate = true;
        }
        if (!data.lastName) {
            updates.lastName = data.nom || (data.name ? data.name.split(' ')[0] : "");
            needsUpdate = true;
        }
        if (!data.firstName) {
            updates.firstName = data.prenoms || (data.name ? data.name.split(' ').slice(1).join(' ') : "");
            needsUpdate = true;
        }
        if (!data.title) {
            updates.title = data.titre || "Chef de Village";
            needsUpdate = true;
        }
        if (!data.role) {
            updates.role = "Chef de Village";
            needsUpdate = true;
        }
        if (!data.region) {
            updates.region = "BAFING";
            needsUpdate = true;
        }
        if (!data.department) {
            updates.department = "Inconnu";
            needsUpdate = true;
        }
        if (!data.subPrefecture) {
            updates.subPrefecture = "Inconnu";
            needsUpdate = true;
        }
        if (!data.village) {
            updates.village = "Inconnu";
            needsUpdate = true;
        }
        if (!data.contact) {
            updates.contact = "";
            needsUpdate = true;
        }
        if (!data.bio) {
            updates.bio = data.arrete || "";
            needsUpdate = true;
        }
        if (!data.photoUrl) {
            updates.photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'CV')}&background=006039&color=fff&size=100`;
            needsUpdate = true;
        }

        if (needsUpdate) {
            try {
                await updateDoc(doc(db, 'chiefs', id), updates);
                fixedCount++;
                if (fixedCount % 50 === 0) console.log(`  Normalisé ${fixedCount} documents...`);
            } catch (err: any) {
                console.error(`  Erreur sur ${id}: ${err.message}`);
            }
        }
    }

    console.log(`\nNormalization complete: ${fixedCount} documents updated.`);
    process.exit(0);
}

fixAllChiefs();

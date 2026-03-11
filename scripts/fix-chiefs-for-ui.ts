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

async function fixChiefsDisplay() {
    let db: any, collection: any, getDocs: any, updateDoc: any, doc: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db; collection = fb.collection; getDocs = fb.getDocs;
        updateDoc = fb.updateDoc; doc = fb.doc;
    } catch (e: any) { console.error("Firebase import failed:", e.message); return; }

    console.log("Fetching all chiefs to check for missing fields...");
    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    console.log(`Total chiefs in DB: ${chiefsSnap.docs.length}`);

    let fixedCount = 0;
    let skipCount = 0;

    for (const chefDoc of chiefsSnap.docs) {
        const data = chefDoc.data();
        const id = chefDoc.id;

        // Fields to ensure are present for the UI list
        const needsLastName = !data.lastName || data.lastName === "";
        const needsFirstName = !data.firstName || data.firstName === "";
        const needsTitle = !data.title || data.title === "";

        if (needsLastName || needsFirstName || needsTitle) {
            const updates: any = {};

            if (needsLastName) {
                updates.lastName = data.nom || (data.name ? data.name.split(' ')[0] : 'Inconnu');
            }
            if (needsFirstName) {
                updates.firstName = data.prenoms || (data.name ? data.name.split(' ').slice(1).join(' ') : 'Inconnu');
            }
            if (needsTitle) {
                updates.title = data.titre || "Chef de Village";
            }

            try {
                await updateDoc(doc(db, 'chiefs', id), updates);
                fixedCount++;
                if (fixedCount % 50 === 0) console.log(`  Fixed ${fixedCount} documents...`);
            } catch (err: any) {
                console.error(`  Error fixing ${id}: ${err.message}`);
            }
        } else {
            skipCount++;
        }
    }

    console.log(`\nFix complete:`);
    console.log(`- Total processed: ${chiefsSnap.docs.length}`);
    console.log(`- Documents updated: ${fixedCount}`);
    console.log(`- Documents already correct: ${skipCount}`);

    process.exit(0);
}

fixChiefsDisplay();

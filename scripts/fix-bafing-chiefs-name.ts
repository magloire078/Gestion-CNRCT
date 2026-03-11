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

async function fixNames() {
    let db: any, collection: any, getDocs: any, updateDoc: any, doc: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        getDocs = fb.getDocs;
        updateDoc = fb.updateDoc;
        doc = fb.doc;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    try {
        const chiefsSnap = await getDocs(collection(db, 'chiefs'));
        let fixedCount = 0;

        for (const chiefDoc of chiefsSnap.docs) {
            const data = chiefDoc.data();
            if (!data.name && data.nomComplet) {
                console.log(`Fixing name for ${data.nomComplet}...`);
                await updateDoc(doc(db, 'chiefs', chiefDoc.id), {
                    name: data.nomComplet
                });
                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} chiefs.`);

    } catch (err: any) {
        console.error("Fix failed:", err.message);
    }
    process.exit(0);
}

fixNames();

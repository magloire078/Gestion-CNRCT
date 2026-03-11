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

async function fixMissingFields() {
    let db: any, collection: any, getDocs: any, updateDoc: any, doc: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db; collection = fb.collection; getDocs = fb.getDocs;
        updateDoc = fb.updateDoc; doc = fb.doc;
    } catch (e: any) { console.error("Firebase import failed:", e.message); return; }

    const chiefsSnap = await getDocs(collection(db, 'chiefs'));
    console.log(`Total chiefs in DB: ${chiefsSnap.docs.length}`);

    let withoutLastName = 0;
    let fixed = 0;
    let errors = 0;

    for (const chiefDoc of chiefsSnap.docs) {
        const data = chiefDoc.data();
        const needsFix = !data.lastName || data.lastName === '';

        if (needsFix) {
            withoutLastName++;
            // Try to derive lastName/firstName from existing fields
            let lastName = data.lastName || data.nom || '';
            let firstName = data.firstName || data.prenoms || '';

            // If name exists but no lastName/firstName, try to split from name
            if (!lastName && !firstName && data.name) {
                const parts = data.name.trim().split(' ');
                lastName = parts[0] || '';
                firstName = parts.slice(1).join(' ') || '';
            }

            // Also ensure 'title' field exists (needed for filtering in page.tsx)
            const title = data.title || data.titre || 'Chef de Village';
            const updateData: any = { lastName, firstName, title };

            try {
                await updateDoc(doc(db, 'chiefs', chiefDoc.id), updateData);
                fixed++;
            } catch (err: any) {
                console.error(`Error fixing ${data.name}: ${err.message}`);
                errors++;
            }
        }
    }

    console.log(`\nDiagnostic Results:`);
    console.log(`  Total docs: ${chiefsSnap.docs.length}`);
    console.log(`  Without lastName: ${withoutLastName}`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Errors: ${errors}`);

    process.exit(0);
}

fixMissingFields();

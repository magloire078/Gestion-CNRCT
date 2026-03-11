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

async function debugData() {
    let db: any, collection: any, getDocs: any, query: any, where: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        getDocs = fb.getDocs;
        query = fb.query;
        where = fb.where;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    try {
        // 1. Count Chiefs
        const chiefsSnap = await getDocs(collection(db, 'chiefs'));
        console.log(`TOTAL_CHIEFS_COUNT: ${chiefsSnap.size}`);

        // 2. Find Regional Committee Members in Employees
        const empSnap = await getDocs(collection(db, 'employees'));
        const regionalMembers = empSnap.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() }))
            .filter((emp: any) =>
                emp.poste === 'Membre Comité Régional' ||
                (emp.poste && emp.poste.toLowerCase().includes('comité régional'))
            );

        console.log(`TOTAL_REGIONAL_MEMBERS_IN_EMPLOYEES: ${regionalMembers.length}`);

        // Print some names for confirmation
        regionalMembers.slice(0, 5).forEach((m: any) => {
            console.log(`  - ${m.lastName} ${m.firstName} (${m.poste}) - Region: ${m.Region}, Dept: ${m.Departement}`);
        });

    } catch (err: any) {
        console.error("Debug failed:", err.message);
    }
    process.exit(0);
}

debugData();

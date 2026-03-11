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

async function importRegionalMembers() {
    let db: any, collection: any, getDocs: any, addDoc: any, query: any, where: any;
    try {
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        getDocs = fb.getDocs;
        addDoc = fb.addDoc;
        query = fb.query;
        where = fb.where;
    } catch (e: any) {
        console.error("Firebase import failed:", e.message);
        return;
    }

    try {
        // 1. Get existing chiefs names to avoid duplicates
        const chiefsSnap = await getDocs(collection(db, 'chiefs'));
        const existingNames = new Set(
            chiefsSnap.docs
                .map((d: any) => d.data().name)
                .filter((name: any) => name && typeof name === 'string')
                .map((name: string) => name.toUpperCase().trim())
        );
        console.log(`Existing chiefs count with valid names: ${existingNames.size}`);

        // 2. Get regional members from employees
        const empSnap = await getDocs(collection(db, 'employees'));
        const regionalMembers = empSnap.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() }))
            .filter((emp: any) =>
                emp.poste === 'Membre Comité Régional' ||
                (emp.poste && emp.poste.toLowerCase().includes('comité régional'))
            );

        console.log(`Found ${regionalMembers.length} regional committee members in employees.`);

        let addedCount = 0;
        let skippedCount = 0;

        for (const member of regionalMembers) {
            const fullName = `${member.lastName || ''} ${member.firstName || ''}`.trim() || member.name;
            const upperName = fullName.toUpperCase().trim();

            if (existingNames.has(upperName)) {
                skippedCount++;
                continue;
            }

            const chiefData = {
                name: fullName,
                lastName: member.lastName || '',
                firstName: member.firstName || '',
                title: member.poste || 'Membre Comité Régional',
                role: 'Chef de Village', // User specified treating them as village chiefs
                region: member.Region || '',
                department: member.Departement || '',
                subPrefecture: member.subPrefecture || '',
                village: member.Village || 'À préciser',
                contact: member.mobile || member.phone || '',
                photoUrl: member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=006039&color=fff&size=100`,
                source: 'Import Comité Régional',
                statut: 'Vivant'
            };

            await addDoc(collection(db, 'chiefs'), chiefData);
            existingNames.add(upperName);
            addedCount++;

            if (addedCount % 20 === 0) {
                console.log(`Progress: ${addedCount} added...`);
            }
        }

        console.log(`Finished: ${addedCount} added, ${skippedCount} skipped (duplicates).`);

    } catch (err: any) {
        console.error("Import failed:", err.message);
    }
    process.exit(0);
}

importRegionalMembers();

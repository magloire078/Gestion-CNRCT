import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Manually load environment variables from .env.local before any other imports
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
console.log("Environment variables loaded. Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

async function runImport() {
    let db, collection, query, where, getDocs, addDoc;
    try {
        console.log("Attempting dynamic import of firebase...");
        const fb = await import('../src/lib/firebase.js' as any);
        db = fb.db;
        collection = fb.collection;
        query = fb.query;
        where = fb.where;
        getDocs = fb.getDocs;
        addDoc = fb.addDoc;
        console.log("Firebase imported. DB is defined:", !!db);
    } catch (e: any) {
        console.error("Dynamic import failed:", e.message);
        return;
    }

    try {
        const csvPath = path.join(process.cwd(), 'public', 'data', 'villages_ivory_coast_osm.csv');
        if (!fs.existsSync(csvPath)) {
            console.error("CSV file not found at:", csvPath);
            return;
        }

        const csvData = fs.readFileSync(csvPath, 'utf8');
        const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        const rows = results.data as any[];

        console.log(`Starting Public Import of ${rows.length} villages...`);

        let added = 0;
        let skipped = 0;
        const batchSize = 100;

        for (let i = 0; i < rows.length; i += batchSize) {
            const chunk = rows.slice(i, i + batchSize);
            console.log(`Processing chunk ${Math.floor(i / batchSize) + 1} / ${Math.ceil(rows.length / batchSize)}...`);

            const promises = chunk.map(async (row) => {
                const name = row.nom?.trim();
                if (!name) return;

                const region = row.region?.trim() || "";
                const department = row.departement?.trim() || "";
                const subPrefecture = row.sous_prefecture?.trim() || "";

                // Check for existence
                const q = query(
                    collection(db, "villages"),
                    where("name", "==", name),
                    where("region", "==", region),
                    where("department", "==", department),
                    where("subPrefecture", "==", subPrefecture)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    skipped++;
                    return;
                }

                const newVillage = {
                    name,
                    region,
                    department,
                    subPrefecture,
                    commune: subPrefecture,
                    latitude: parseFloat(row.latitude) || null,
                    longitude: parseFloat(row.longitude) || null,
                    population: parseInt(row.population) || null,
                    source: "OSM Public Import",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await addDoc(collection(db, "villages"), newVillage);
                added++;
            });

            await Promise.all(promises);
            console.log(`Progress: ${added} added, ${skipped} skipped.`);
        }

        console.log("Public Import completed!");
        console.log(`Total added: ${added}`);
        console.log(`Total skipped: ${skipped}`);
    } catch (error) {
        console.error("Fatal error during import:", error);
    }
}

runImport().catch(console.error);

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const inputPath = path.join(process.cwd(), 'public_data', 'ci_cities.csv');
const outputPath = path.join(process.cwd(), 'public', 'data', 'villages_ci_geoloc.csv');

// Read the raw CSV file
const rawCsv = fs.readFileSync(inputPath, 'utf8');

// Parse the CSV
Papa.parse(rawCsv, {
    header: true,
    complete: (results) => {
        const data = results.data as any[];

        // Map to our expected format
        const formattedData = data.filter(row => row.city && row.city.trim() !== '').map(row => {
            return {
                nom: row.city,
                region: row.admin_name || '',
                departement: '', // Data not available in this dataset
                sous_prefecture: '', // Data not available in this dataset
                latitude: row.lat,
                longitude: row.lng,
                population: row.population || ''
            };
        });

        // Convert back to CSV
        const csv = Papa.unparse(formattedData);

        // Ensure directory exists
        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Write output
        fs.writeFileSync(outputPath, csv, 'utf8');
        console.log(`Successfully converted ${formattedData.length} entries to ${outputPath}`);
    }
});

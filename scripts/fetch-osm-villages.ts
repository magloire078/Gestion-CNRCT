import fs from 'fs';
import path from 'path';

async function fetchFromOverpass() {
    console.log("Fetching villages from OpenStreetMap (Overpass API)...");

    // Query for villages, hamlets and towns in Ivory Coast using ISO code
    const query = `
        [out:json][timeout:180];
        area["ISO3166-1"="CI"]->.searchArea;
        (
          node["place"~"village|town|hamlet"](area.searchArea);
        );
        out body;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Found ${data.elements?.length || 0} elements.`);

        if (!data.elements) return;

        const villages = data.elements.map((el: any) => {
            const tags = el.tags || {};
            return {
                nom: tags.name || tags["name:fr"] || "Inconnu",
                region: tags["is_in:region"] || tags["addr:region"] || "",
                departement: tags["is_in:department"] || tags["addr:district"] || "",
                sous_prefecture: tags["is_in:subprefecture"] || tags["addr:subdistrict"] || "",
                latitude: el.lat,
                longitude: el.lon,
                population: tags.population || ""
            };
        });

        // Filter out empty names
        const cleanVillages = villages.filter((v: any) => v.nom !== "Inconnu");

        // Convert to CSV
        const headers = ["nom", "region", "departement", "sous_prefecture", "latitude", "longitude", "population"];
        const csvRows = [headers.join(",")];

        for (const v of cleanVillages) {
            const row = headers.map(h => `"${(v[h] || '').toString().replace(/"/g, '""')}"`);
            csvRows.push(row.join(","));
        }

        const outputPath = path.join(process.cwd(), 'public', 'data', 'villages_ivory_coast_osm.csv');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, csvRows.join("\n"), 'utf8');

        console.log(`Successfully saved ${cleanVillages.length} villages to ${outputPath}`);
    } catch (error) {
        console.error("Error fetching from Overpass:", error);
    }
}

fetchFromOverpass();

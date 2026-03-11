import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// We will fetch the Wikipedia API for the list of Communes of Ivory Coast
async function fetchIvorianCommunes() {
    console.log("Fetching list of communes from Wikipedia...");
    try {
        // Query the Wikipedia API for the page "Liste des communes de la Côte d'Ivoire"
        const response = await fetch("https://fr.wikipedia.org/w/api.php?action=parse&page=Liste_des_communes_de_la_C%C3%B4te_d%27Ivoire&format=json&prop=text");
        const data = await response.json();
        const html = data.parse.text["*"];

        // Very basic parsing to find words that look like City/Commune names
        // In real world, we'd use cheerio, but we can do a quick regex extraction for <li><a href="...">Name</a></li>
        const regex = /<li><a href="\/wiki\/[^"]+" title="[^"]+">([^<]+)<\/a><\/li>/g;
        let match;
        const communes = new Set<string>();

        while ((match = regex.exec(html)) !== null) {
            communes.add(match[1]);
        }

        console.log(`Extracted raw nodes: ${communes.size}`);

        // Filter out obvious noise
        const validCities = Array.from(communes).filter(c => {
            return c.length > 2 && !c.includes(":") && !c.includes("Liste") && !c.includes("Catégorie") && !c.includes("Portail");
        });

        console.log(`Filtered valid communes: ${validCities.length}`);

        const formattedData = validCities.map(city => ({
            nom: city,
            region: '',
            departement: '',
            sous_prefecture: '',
            latitude: '',
            longitude: '',
            population: ''
        }));

        const csv = Papa.unparse(formattedData);

        const outputPath = path.join(process.cwd(), 'public', 'data', 'communes_ci_starter.csv');
        fs.writeFileSync(outputPath, csv, 'utf8');
        console.log(`Saved starter dataset to ${outputPath}`);

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

fetchIvorianCommunes();

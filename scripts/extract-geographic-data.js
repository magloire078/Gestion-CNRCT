const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../src/lib/ivory-coast-divisions.ts');
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (!match) {
    console.error("Could not parse divisions");
    process.exit(1);
}

const divisions = eval('(' + match[1] + ')');

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

const districtMapping = {
    "Abidjan": "Abidjan",
    "Yamoussoukro": "Yamoussoukro",
    "Nawa": "Bas-Sassandra",
    "San-Pédro": "Bas-Sassandra",
    "Gbôklé": "Bas-Sassandra",
    "Indénié-Djuablin": "Comoé",
    "Sud-Comoé": "Comoé",
    "Kabadougou": "Denguélé",
    "Folon": "Denguélé",
    "Gôh": "Gôh-Djiboua",
    "Lôh-Djiboua": "Gôh-Djiboua",
    "Bélier": "Lacs",
    "N'Zi": "Lacs",
    "Iffou": "Lacs",
    "Moronou": "Lacs",
    "Agnéby-Tiassa": "Lagunes",
    "Mé": "Lagunes",
    "Grands-Ponts": "Lagunes",
    "Tonkpi": "Montagnes",
    "Cavally": "Montagnes",
    "Guémon": "Montagnes",
    "Haut-Sassandra": "Sassandra-Marahoué",
    "Marahoué": "Sassandra-Marahoué",
    "Poro": "Savanes",
    "Tchologo": "Savanes",
    "Bagoué": "Savanes",
    "Gbêkê": "Vallée du Bandama",
    "Hambol": "Vallée du Bandama",
    "Worodougou": "Woroba",
    "Bafing": "Woroba",
    "Béré": "Woroba",
    "Gontougo": "Zanzan",
    "Bounkani": "Zanzan"
};

const districtsSet = new Set(Object.values(districtMapping));
const districts = Array.from(districtsSet).map(name => ({
    id: `dist-${slugify(name)}`,
    nom: name,
    type: name === "Abidjan" || name === "Yamoussoukro" ? "Autonome" : "Régional"
}));

const regions = [];
const departements = [];
const sous_prefectures = [];

for (const [regionName, depts] of Object.entries(divisions)) {
    const distName = districtMapping[regionName] || "Inconnu";
    const distId = `dist-${slugify(distName)}`;
    const regId = `reg-${slugify(regionName)}`;

    // In current data we don't strictly have chef-lieu at region level easily identifiable, but we can guess or leave empty/first dept
    let chef_lieu = Object.keys(depts)[0] || "";

    regions.push({
        id: regId,
        district_id: distId,
        nom: regionName,
        chef_lieu: chef_lieu
    });

    for (const [deptName, sps] of Object.entries(depts)) {
        const deptId = `dept-${slugify(deptName)}`;

        departements.push({
            id: deptId,
            region_id: regId,
            nom: deptName
        });

        for (const [spName, villages] of Object.entries(sps)) {
            const spId = `sp-${slugify(spName)}`;

            sous_prefectures.push({
                id: spId,
                departement_id: deptId,
                nom: spName,
                localites: villages
            });
        }
    }
}

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'districts.json'), JSON.stringify(districts, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'regions.json'), JSON.stringify(regions, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'departements.json'), JSON.stringify(departements, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'sous_prefectures.json'), JSON.stringify(sous_prefectures, null, 2), 'utf8');

console.log("Extraction complete!");

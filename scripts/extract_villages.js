const fs = require('fs');
const path = require('path');

function normalize(str) {
    if (!str) return str;
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const tsvPath = path.join(process.cwd(), "data", "comites_regionaux_2026.tsv");
const tsvData = fs.readFileSync(tsvPath, "utf8").split("\n").filter(l => l.trim().length > 0);
tsvData.shift(); // skip header

// Read divisions
const divPath = path.join(process.cwd(), "src/lib/ivory-coast-divisions.ts");
const divContent = fs.readFileSync(divPath, "utf8");

// Parse the divisions object
const startIndex = divContent.indexOf('export const divisions: Division = ') + 'export const divisions: Division = '.length;
const endIndex = divContent.lastIndexOf(';');
const jsonStr = divContent.substring(startIndex, endIndex);

let divisions;
try {
    divisions = JSON.parse(jsonStr);
} catch (e) {
    console.error("Failed to parse divisions JSON", e);
    process.exit(1);
}

let addedCount = 0;

for (const line of tsvData) {
    const parts = line.split("\t");
    if (parts.length < 7) continue;

    let region = parts[1].trim();
    let dept = parts[2].trim();
    
    // Mappings for TSV to divisions matching
    const regionMap = {
        'DISTRICT D’ABIDJAN': 'Abidjan',
        'DISTRICT DE YAMOUSSOUKRO': 'Yamoussoukro',
        'HAUT SASSANDRA': 'Haut-Sassandra',
        'ME': 'La Mé',
        'SAN PEDRO': 'San-Pédro',
        'SUD COMOE': 'Sud-Comoé',
    };
    const deptMap = {
        'M’bahiakro': 'M\'Bahiakro',
        'Ouellé': 'Ouellé',
        'M’Batto': 'M\'Batto',
        'M’Bengué': 'M\'Bengué'
    };
    
    if (regionMap[region]) region = regionMap[region];
    if (deptMap[dept]) dept = deptMap[dept];
    
    let rawLocalite = parts[5].trim();

    // Extract village/locality name
    let localite = rawLocalite.replace(/Chef du village de |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village|Chef central de /gi, "").trim();
    
    if (localite.toLowerCase().startsWith("d'") || localite.toLowerCase().startsWith("d’")) {
        localite = localite.substring(2).trim();
    }
    
    localite = localite.charAt(0).toUpperCase() + localite.slice(1);

    const regionKeys = Object.keys(divisions);
    let matchedRegion = regionKeys.find(k => normalize(k) === normalize(region));
    
    if (!matchedRegion) {
        console.log(`Region not found: ${region}`);
        continue;
    }

    const deptKeys = Object.keys(divisions[matchedRegion]);
    let matchedDept = deptKeys.find(k => normalize(k) === normalize(dept));

    if (!matchedDept) {
        console.log(`Department not found: ${dept} in ${matchedRegion}`);
        continue;
    }

    const subPrefs = divisions[matchedRegion][matchedDept];
    let villageFound = false;

    for (const sp in subPrefs) {
        if (subPrefs[sp].some(v => normalize(v) === normalize(localite))) {
            villageFound = true;
            break;
        }
    }

    if (!villageFound) {
        let targetSp = Object.keys(subPrefs).find(k => normalize(k) === normalize(dept));
        if (!targetSp) {
            targetSp = Object.keys(subPrefs)[0];
        }
        if (targetSp) {
            subPrefs[targetSp].push(localite);
            subPrefs[targetSp].sort((a, b) => a.localeCompare(b));
            addedCount++;
            console.log(`Added ${localite} to ${matchedRegion} -> ${matchedDept} -> ${targetSp}`);
        }
    }
}

console.log(`Total added: ${addedCount}`);

// Write back to file
const outContent = `export interface Division {
  [region: string]: {
    [department: string]: {
      [subPrefecture: string]: string[];
    };
  };
}

export const divisions: Division = ${JSON.stringify(divisions, null, 2)};
`;

fs.writeFileSync(divPath, outContent);

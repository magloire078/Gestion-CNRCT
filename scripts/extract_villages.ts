import fs from "fs";
import path from "path";
import { divisions } from "../src/lib/ivory-coast-divisions";

function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const tsvPath = path.join(process.cwd(), "data", "comites_regionaux_2026.tsv");
const tsvData = fs.readFileSync(tsvPath, "utf8").split("\n").filter(l => l.trim().length > 0);
tsvData.shift(); // skip header

let addedCount = 0;

for (const line of tsvData) {
    const parts = line.split("\t");
    if (parts.length < 7) continue;

    let region = parts[1].trim();
    let dept = parts[2].trim();
    let rawLocalite = parts[5].trim();

    // Extract village/locality name
    let localite = rawLocalite.replace(/Chef du village de |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village|Chef central de /gi, "").trim();
    
    // Sometimes it has "d'"
    if (localite.toLowerCase().startsWith("d'") || localite.toLowerCase().startsWith("d’")) {
        localite = localite.substring(2).trim();
    }
    
    localite = localite.charAt(0).toUpperCase() + localite.slice(1);

    // Find the right region in divisions
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

    // Check if the village already exists in ANY subPrefecture of this department
    for (const sp in subPrefs) {
        if (subPrefs[sp].some(v => normalize(v) === normalize(localite))) {
            villageFound = true;
            break;
        }
    }

    if (!villageFound) {
        // Add to the subPrefecture that has the same name as the department, or the first one
        let targetSp = Object.keys(subPrefs).find(k => normalize(k) === normalize(dept));
        if (!targetSp) {
            targetSp = Object.keys(subPrefs)[0];
        }
        if (targetSp) {
            subPrefs[targetSp].push(localite);
            // sort villages
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

fs.writeFileSync(path.join(process.cwd(), "src/lib/ivory-coast-divisions.ts"), outContent);

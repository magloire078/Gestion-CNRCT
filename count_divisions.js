const fs = require('fs');

const file = fs.readFileSync('src/lib/ivory-coast-divisions.ts', 'utf8');

const lines = file.split('\n');
let inSoubreDept = false;
let currentSP = '';

for (const line of lines) {
    if (line.includes('"Soubré": {') || line.includes("'Soubré': {")) {
        inSoubreDept = true;
        console.log("Found SOUBRE DEPT");
    } else if (inSoubreDept && line.match(/^\s+\},/)) {
        inSoubreDept = false;
        console.log("End SOUBRE DEPT");
    }

    if (inSoubreDept) {
        if (line.includes(': [')) {
            currentSP = line.split(':')[0].trim().replace(/['"]/g, '');
            console.log("SP:", currentSP);
        }

        if (line.includes('"') || line.includes("'")) {
            if (line.trim().startsWith('"') || line.trim().startsWith("'")) {
                console.log("  -", line.trim());
            }
        }
    }
}

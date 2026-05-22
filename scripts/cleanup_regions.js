const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    // Clean up duplicates
    if (divisions["La Mé"] && divisions["Mé"]) {
        delete divisions["La Mé"];
    }
    if (divisions["N’Zi"] && divisions["N'Zi"]) {
        delete divisions["N’Zi"];
    } else if (divisions["N’Zi"] && !divisions["N'Zi"]) {
        divisions["N'Zi"] = divisions["N’Zi"];
        delete divisions["N’Zi"];
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully cleaned up duplicate regions.");
} else {
    console.log("Could not parse divisions");
}

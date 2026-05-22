const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const folonData = {
        "Minignan": {
            "Minignan": ["Minignan-Village", "Banandjé", "Boudiou", "Dioulatiédougou-Secteur", "Goulia (limite)", "Goullon", "Kimbirila-Nord (limite)", "Lingo", "Mahandougou", "Nabagala", "Right-Bank-Folon", "Ségbéhoa-Nord", "Sokourani-Folon", "Sombadougou", "Tienko (limite)", "Tokala", "Zéguetila"],
            "Goulia": ["Goulia", "Kani-Secteur", "Kourouba-Folon", "Missamahana", "Nafana-Folon", "Sémé-Nord", "Turco"],
            "Tienko": ["Tienko", "Alloko-Tienko", "Diégonépa-Folon", "Ggata-Tienko", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Kimbirila-Nord": ["Kimbirila-Nord", "Bougousso", "Dialakoro", "Dougba", "Farandougou", "Kolon", "Samango"]
        },
        "Kaniasso": {
            "Kaniasso": ["Kaniasso-Village", "Bamako-Cité (Campement)", "Gangan", "Gblétia-Folon", "Gbon-Secteur", "Kébi-Folon", "Mahandiana", "Right-Bank-Kaniasso", "Ségbéhoa-Kaniasso", "Sokourani", "Tiékorodougou-Ouest"]
        }
    };

    if (!divisions["Folon"]) divisions["Folon"] = {};

    for (const [department, subPrefectures] of Object.entries(folonData)) {
        if (!divisions["Folon"][department]) divisions["Folon"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Folon"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Folon region");
} else {
    console.log("Could not parse divisions");
}

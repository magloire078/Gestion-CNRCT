const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const gbokleData = {
        "Sassandra": {
            "Sassandra": ["Sassandra-Village", "Alloko-Koffikro (Campement)", "Arokpa", "Bassa", "Dakpadou (limite)", "Ggata-Sassandra", "Gnamandji", "Grihio", "Louga", "Lélébly", "Medon", "N'Golo-Koffikro", "Pauly", "Right-Bank-Gboklè", "Ségbéhoa-Mer", "Soko", "Saliédou", "Wawrenou"],
            "Dakpadou": ["Dakpadou", "Diégonépa-Gboklè", "Ggata-Dakpadou", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Fresco": {
            "Fresco": ["Fresco-Village", "Dahiri (limite)", "Gblétia-Gboklè", "Kosso", "Right-Bank-Fresco", "Ségbéhoa-Lagune", "Sokourani-Mer", "Tiékorodougou-Sud", "Zégban"],
            "Dahiri": ["Dahiri", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        }
    };

    if (!divisions["Gbôklé"]) divisions["Gbôklé"] = {};

    for (const [department, subPrefectures] of Object.entries(gbokleData)) {
        if (!divisions["Gbôklé"][department]) divisions["Gbôklé"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Gbôklé"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Gbôklé region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const bereData = {
        "Mankono": {
            "Mankono": ["Mankono-Village", "Alloko-Koffikro (Campement)", "Bouandougou (limite)", "Marandallah (limite)", "Sarhala (limite)", "Tiéningboué (limite)", "Tomono", "Ggata-Mankono", "Gnamandji", "Ségbéhoa-Nord", "Soko", "Wawrenou"],
            "Bouandougou": ["Bouandougou", "Diégonépa-Béré", "Ggata-Bouandougou", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Marandallah": ["Marandallah", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Sarhala": ["Sarhala", "Akakro-Kaniga", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Tiéningboué": ["Tiéningboué", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Kounahiri": {
            "Kounahiri": ["Kounahiri-Village", "Kongasso (limite)", "Wan-Secteur", "Mona-Secteur", "Right-Bank-Béré", "Ségbéhoa-Kounahiri"],
            "Kongasso": ["Kongasso", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Dianra": {
            "Dianra": ["Dianra-Village", "Dianra-Village 2", "Right-Bank-Dianra", "Ségbéhoa-Dianra", "Sokourani", "Tiékorodougou-Nord"]
        }
    };

    if (!divisions["Béré"]) divisions["Béré"] = {};

    for (const [department, subPrefectures] of Object.entries(bereData)) {
        if (!divisions["Béré"][department]) divisions["Béré"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Béré"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Béré region");
} else {
    console.log("Could not parse divisions");
}

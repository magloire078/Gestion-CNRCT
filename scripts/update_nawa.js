const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const nawaData = {
        "Soubré": {
            "Soubré": ["Soubré-Village", "Alloko-Koffikro (Campement)", "Grand-Zattry (limite)", "Kpotè", "Lessiri", "Liliyo (limite)", "Okrouyo (limite)", "Oupoyo (limite)", "Petit-Bouaké", "Right-Bank-Nawa", "Ségbéhoa-Sud", "Soko", "Wawrenou", "Yabayo"],
            "Grand-Zattry": ["Grand-Zattry", "Diégonépa-Nawa", "Ggata-Zattry", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Liliyo": ["Liliyo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Okrouyo": ["Okrouyo", "Akakro-Nawa", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Méagui": {
            "Méagui": ["Méagui-Village", "Ggata-Méagui", "Gnith", "Hana", "Klonou", "Oupoyo (limite)", "Right-Bank-Méagui", "Ségbéhoa-Méagui", "Sokourani", "Touagui"]
        },
        "Buyo": {
            "Buyo": ["Buyo-Village", "Gblétia-Nawa", "Gbon-Secteur", "Right-Bank-Buyo", "Ségbéhoa-Buyo", "Tiékorodougou-Ouest"]
        },
        "Gueyo": {
            "Gueyo": ["Gueyo-Village", "Alloko-Gueyo", "N'Gatta-Koffikro", "Saria-Gueyo"]
        }
    };

    if (!divisions["Nawa"]) divisions["Nawa"] = {};

    for (const [department, subPrefectures] of Object.entries(nawaData)) {
        if (!divisions["Nawa"][department]) divisions["Nawa"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Nawa"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Nawa region");
} else {
    console.log("Could not parse divisions");
}

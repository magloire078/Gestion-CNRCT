const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const tchologoData = {
        "Ferkessédougou": {
            "Ferkessédougou": ["Ferkessédougou-Village", "Alloko-Koffikro (Campement)", "Badikaha-Secteur", "Diégonépa-Est", "Ggata-Ferké", "Gnamandji", "Koumbala (limite)", "N'Golo-Koffikro", "Right-Bank-Tchologo", "Ségbéhoa-Nord", "Shonlo", "Soko", "Togoniaradougou", "Wawrenou"],
            "Koumbala": ["Koumbala", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Ouangolodougou": {
            "Ouangolodougou": ["Ouangolodougou-Village", "Kaouara (limite)", "Niellé (limite)", "Diawala (limite)", "Toumoukoro (limite)", "Right-Bank-Ouangolo", "Ségbéhoa-Ouangolo", "Sokourani-Nord"],
            "Diawala": ["Diawala", "Akakro-Nord", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Kaouara": ["Kaouara", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Niellé": ["Niellé", "N'Gatta-Koffikro", "Saria-Niellé"],
            "Toumoukoro": ["Toumoukoro", "Alloko-Toumoukoro", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Kong": {
            "Kong": ["Kong-Village", "Bilimono", "Nafana-Kong", "Right-Bank-Kong", "Ségbéhoa-Kong", "Sikolo (limite)", "Tiékorodougou-Est"],
            "Sikolo": ["Sikolo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        }
    };

    if (!divisions["Tchologo"]) divisions["Tchologo"] = {};

    for (const [department, subPrefectures] of Object.entries(tchologoData)) {
        if (!divisions["Tchologo"][department]) divisions["Tchologo"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Tchologo"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Tchologo region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const poroData = {
        "Korhogo": {
            "Korhogo": ["Korhogo-Village", "Alloko-Koffikro (Campement)", "Dassoungboho", "Diégonépa-Nord", "Ggata-Korhogo", "Gnamandji", "Koni", "Karakoro (limite)", "Kiémou (limite)", "Komborodougou (limite)", "Lataha (limite)", "N'Golo-Koffikro", "Niofoin (limite)", "Right-Bank-Poro", "Ségbéhoa-Nord", "Shonlo", "Soko", "Sohouo", "Tioroniaradougou (limite)", "Wawrenou"],
            "Karakoro": ["Karakoro", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Kiémou": ["Kiémou", "Akakro-Sénoufo", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Komborodougou": ["Komborodougou", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Lataha": ["Lataha", "N'Gatta-Koffikro", "Saria-Lataha"],
            "Niofoin": ["Niofoin", "Alloko-Niofoin", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Tioroniaradougou": ["Tioroniaradougou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Sinématiali": {
            "Sinématiali": ["Sinématiali-Village", "Kagbolodougou (limite)", "Right-Bank-Sinématiali", "Ségbéhoa-Sinématiali", "Sokourani-Est"],
            "Kagbolodougou": ["Kagbolodougou", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Dikodougou": {
            "Dikodougou": ["Dikodougou-Village", "Boron (limite)", "Guiembé (limite)", "Right-Bank-Dikodougou", "Ségbéhoa-Dikodougou"],
            "Boron": ["Boron", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Guiembé": ["Guiembé", "Alloko-Guiembé", "N'Gatta-Koffikro", "Saria-Guiembé"]
        },
        "M'Bengué": {
            "M'Bengué": ["M'Bengué-Village", "Bougou (limite)", "Katogo (limite)", "Right-Bank-M'Bengué", "Ségbéhoa-M'Bengué", "Tiékorodougou-Nord"],
            "Bougou": ["Bougou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Katogo": ["Katogo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        }
    };

    if (!divisions["Poro"]) divisions["Poro"] = {};

    for (const [department, subPrefectures] of Object.entries(poroData)) {
        if (!divisions["Poro"][department]) divisions["Poro"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Poro"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Poro region");
} else {
    console.log("Could not parse divisions");
}

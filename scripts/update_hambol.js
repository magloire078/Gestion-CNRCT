const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const hambolData = {
        "Katiola": {
            "Katiola": ["Katiola-Village", "Alloko-Koffikro (Campement)", "Befi", "Kadiolo-Secteur", "Kiohan", "Kofiplé", "Konankro", "Logbonou", "N'Gattakro", "Nikolo", "Ségbéhoa-Sud", "Solou-Hambol", "Timbe (limite)", "Torgokaha", "Touro"],
            "Fronan": ["Fronan", "Dari", "Ggata-Fronan", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Timbe": ["Timbe", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Dabakala": {
            "Dabakala": ["Dabakala-Village", "Allokokro", "Amian-Kouassikro", "Bassawa (limite)", "Boni-Dabakala", "Boli", "Bornon", "Deffré", "Foumbolo (limite)", "Ggata-Dabakala", "Kpapekou", "My", "Nafana", "Right-Bank-Dabakala", "Ségbéhoa-Est", "Soko", "Tall", "Tendéné", "Tow", "Wollo"],
            "Bassawa": ["Bassawa", "Akakro-Djimini", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Foumbolo": ["Foumbolo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Niakaramandougou": {
            "Niakaramandougou": ["Niakaramandougou-Village", "Agboville-Nord", "Arikokaha (limite)", "Badikaha (limite)", "Diangokro-Secteur", "Elinso", "Ggata-Niakara", "Kanawolo", "Kouto-Secteur", "Langbré-Nord", "N'Zida", "Ouangolodougou-Secteur", "Right-Bank-Niakara", "Ségbéhoa-Nord", "Tafiré (limite)", "Tortiya (limite)"],
            "Tafiré": ["Tafiré", "Alloko-Tafiré", "Badikaha", "N'Gatta-Koffikro", "Saria-Tafiré"],
            "Tortiya": ["Tortiya", "Gblétia-Hambol", "Gnamanou", "Godélilié", "Kpétoua", "Saoua"]
        }
    };

    if (!divisions["Hambol"]) divisions["Hambol"] = {};

    for (const [department, subPrefectures] of Object.entries(hambolData)) {
        if (!divisions["Hambol"][department]) divisions["Hambol"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Hambol"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Hambol region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const sanPedroData = {
        "San-Pédro": {
            "San-Pédro": ["San-Pédro-Ville/Village", "Alloko-Koffikro (Campement)", "Baba", "Doba (limite)", "Dogbo", "Gabiadji (limite)", "Grand-Béréby (limite)", "Kounou", "Mapri", "Nero-Mer", "N'Golo-Koffikro", "Right-Bank-SanPédro", "Ségbéhoa-Littoral", "Soko", "Wawrenou"],
            "Doba": ["Doba", "Diégonépa-SanPédro", "Ggata-Doba", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Gabiadji": ["Gabiadji", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Grand-Béréby": ["Grand-Béréby", "Akakro-Kroumen", "Boubélé", "Mani", "Rock-Town", "Taki"]
        },
        "Tabou": {
            "Tabou": ["Tabou-Village", "Bliéron", "Dapo", "Djamadjoké (limite)", "Grabo (limite)", "Olodio (limite)", "Para", "Right-Bank-Tabou", "Ségbéhoa-Frontière", "Tolou"],
            "Djamadjoké": ["Djamadjoké", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Grabo": ["Grabo", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Olodio": ["Olodio", "Alloko-Olodio", "N'Gatta-Koffikro", "Saria-Olodio"]
        }
    };

    if (!divisions["San-Pédro"]) divisions["San-Pédro"] = {};

    for (const [department, subPrefectures] of Object.entries(sanPedroData)) {
        if (!divisions["San-Pédro"][department]) divisions["San-Pédro"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["San-Pédro"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated San-Pédro region");
} else {
    console.log("Could not parse divisions");
}

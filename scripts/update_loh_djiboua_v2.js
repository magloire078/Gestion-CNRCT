const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const lohDjibouaData = {
        "Divo": {
            "Divo": ["Divo-Village", "Alloko-Koffikro (Campement)", "Chiépo (limite)", "Didoko (limite)", "Diégonépa-Lôh", "Ggata-Divo", "Gnamandji", "Hiré (limite)", "N'Golo-Koffikro", "Ogoudou (limite)", "Right-Bank-Djiboua", "Ségbéhoa-Sud", "Soko", "Wawrenou", "Zégo"],
            "Chiépo": ["Chiépo", "Diégonépa-Divo", "Ggata-Chiépo", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Didoko": ["Didoko", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Hiré": ["Hiré", "Akakro-Dida", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Ogoudou": ["Ogoudou", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Lakota": {
            "Lakota": ["Lakota-Village", "Djidji (limite)", "Gblétia-Djiboua", "Gbon-Secteur", "Goudouko (limite)", "Niambézaria (limite)", "Right-Bank-Lakota", "Ségbéhoa-Lakota", "Sokourani", "Tiékorodougou-Ouest"],
            "Djidji": ["Djidji", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Goudouko": ["Goudouko", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Niambézaria": ["Niambézaria", "Alloko-Niambé", "N'Gatta-Koffikro", "Saria-Niambé"]
        },
        "Guitry": {
            "Guitry": ["Guitry-Village", "Dairo-Didoko (limite)", "Ggata-Guitry", "Gnamandji", "Kani", "N'Gatta-Koffikro", "Roa", "Saria-Guitry", "Zaroko"],
            "Dairo-Didoko": ["Dairo-Didoko", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Lôh-Djiboua"]) divisions["Lôh-Djiboua"] = {};

    for (const [department, subPrefectures] of Object.entries(lohDjibouaData)) {
        if (!divisions["Lôh-Djiboua"][department]) divisions["Lôh-Djiboua"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Lôh-Djiboua"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Lôh-Djiboua region");
} else {
    console.log("Could not parse divisions");
}

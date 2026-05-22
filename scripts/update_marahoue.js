const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const marahoueData = {
        "Bouaflé": {
            "Bouaflé": ["Bouaflé-Village", "Alloko-Koffikro (Campement)", "Begbessou", "Bonon (limite)", "Ggata-Bouaflé", "Gnamandji", "N'Golo-Koffikro", "Pakouabo (limite)", "Right-Bank-Marahoué", "Ségbéhoa-Centre", "Soko", "Tibéita", "Wawrenou", "Zaguiéta"],
            "Bonon": ["Bonon", "Diégonépa-Marahoué", "Ggata-Bonon", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Pakouabo": ["Pakouabo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Sinfra": {
            "Sinfra": ["Sinfra-Village", "Bazré (limite)", "Gblétia-Marahoué", "Kononfla (limite)", "Kouétinfla", "Right-Bank-Sinfra", "Ségbéhoa-Sinfra", "Sokourani", "Tiékorodougou-Est"],
            "Bazré": ["Bazré", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Kononfla": ["Kononfla", "Bodocipa-Sud", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Zuénoula": {
            "Zuénoula": ["Zuénoula-Village", "Gohitafla (limite)", "Kanzra", "Maminigui", "Right-Bank-Zuénoula", "Ségbéhoa-Zuénoula", "Tiékorodougou-Nord", "Vouéboufla"],
            "Gohitafla": ["Gohitafla", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Marahoué"]) divisions["Marahoué"] = {};

    for (const [department, subPrefectures] of Object.entries(marahoueData)) {
        if (!divisions["Marahoué"][department]) divisions["Marahoué"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Marahoué"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Marahoué region");
} else {
    console.log("Could not parse divisions");
}

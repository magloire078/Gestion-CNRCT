const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const bagoueData = {
        "Boundiali": {
            "Boundiali": ["Boundiali-Village", "Alloko-Koffikro (Campement)", "Ganaoni (limite)", "Ggata-Boundiali", "Gnamandji", "Kasséré (limite)", "Kébi-Bagoué", "Kolia (limite)", "N'Golo-Koffikro", "Right-Bank-Bagoué", "Ségbéhoa-Nord", "Soko", "Wawrenou"],
            "Ganaoni": ["Ganaoni", "Diégonépa-Bagoué", "Ggata-Ganaoni", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Kasséré": ["Kasséré", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Kolia": ["Kolia", "Akakro-Bagoué", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Kouto": {
            "Kouto": ["Kouto-Village", "Blessingué (limite)", "Gblétia-Bagoué", "Gbon (limite)", "Right-Bank-Kouto", "Ségbéhoa-Kouto", "Sokourani", "Tiékorodougou-Ouest"],
            "Blessingué": ["Blessingué", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Gbon": ["Gbon", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Tengréla": {
            "Tengréla": ["Tengréla-Village", "Kanakono (limite)", "Papara (limite)", "Right-Bank-Tengréla", "Ségbéhoa-Tengréla"],
            "Kanakono": ["Kanakono", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Papara": ["Papara", "Alloko-Papara", "N'Gatta-Koffikro", "Saria-Papara"]
        }
    };

    if (!divisions["Bagoué"]) divisions["Bagoué"] = {};

    for (const [department, subPrefectures] of Object.entries(bagoueData)) {
        if (!divisions["Bagoué"][department]) divisions["Bagoué"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Bagoué"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Bagoué region");
} else {
    console.log("Could not parse divisions");
}

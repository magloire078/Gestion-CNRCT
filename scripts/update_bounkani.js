const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const bounkaniData = {
        "Bouna": {
            "Bouna": ["Bouna-Village", "Alloko-Koffikro (Campement)", "Bouko (limite)", "Ggata-Bouna", "Gnamandji", "N'Golo-Koffikro", "Ondéfidouo (limite)", "Right-Bank-Bounkani", "Ségbéhoa-Nord", "Soko-Bouna", "Vonkoro (poste frontière Ghana)", "Wawrenou", "Youtou"],
            "Bouko": ["Bouko", "Diégonépa-Bounkani", "Ggata-Bouko", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Ondéfidouo": ["Ondéfidouo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Doropo": {
            "Doropo": ["Doropo-Village", "Danoa (limite)", "Gblétia-Bounkani", "Kalamon (limite)", "Niamoué (limite)", "Right-Bank-Doropo", "Ségbéhoa-Doropo", "Sokourani", "Tiékorodougou-Est"],
            "Kalamon": ["Kalamon", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Niamoué": ["Niamoué", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Nassian": {
            "Nassian": ["Nassian-Village", "Bogofa (limite)", "Kakpin (limite)", "Sominassé (limite)", "Right-Bank-Nassian", "Ségbéhoa-Nassian", "Tiékorodougou-Ouest"],
            "Sominassé": ["Sominassé", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Téhini": {
            "Téhini": ["Téhini-Village", "Alloko-Téhini", "Ggata-Téhini", "Gnamandji", "Kani", "N'Gatta-Koffikro", "Roa", "Saria-Téhini", "Zaroko"]
        }
    };

    if (!divisions["Bounkani"]) divisions["Bounkani"] = {};

    for (const [department, subPrefectures] of Object.entries(bounkaniData)) {
        if (!divisions["Bounkani"][department]) divisions["Bounkani"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Bounkani"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Bounkani region");
} else {
    console.log("Could not parse divisions");
}

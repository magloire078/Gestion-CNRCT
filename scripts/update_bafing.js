const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const bafingData = {
        "Touba": {
            "Touba": ["Touba-Village", "Alloko-Koffikro (Campement)", "Bafin", "Dioman (limite)", "Foungbesso (limite)", "Ganan-Bafing", "Gblétia-Bafing", "Ggata-Touba", "Gnamandji", "Guintéguéla (limite)", "Kamalo-Secteur", "Koro-Secteur", "Massala-Ouest", "Right-Bank-Bafing", "Ségbéhoa-Nord", "Sifié-Secteur", "Sokourani", "Sombadougou", "Tougousso", "Washington-Bafing"],
            "Dioman": ["Dioman", "Koro-Secteur", "Kourouba", "Nafana", "Right-Bank-Dioman", "Sémé"],
            "Foungbesso": ["Foungbesso", "Diégonépa-Bafing", "Ggata-Foungbesso", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Guintéguéla": ["Guintéguéla", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Ouaninou": {
            "Ouaninou": ["Ouaninou-Village", "Gbélo (limite)", "Gouela", "Koonan (limite)", "Mahandougou", "Saboudougou (limite)", "Santa (limite)", "Seydougou-Ouaninou"],
            "Gbélo": ["Gbélo", "Kabala", "Kohoma", "Niamana", "Ouaragahio-Secteur", "Right-Bank-Gbélo"],
            "Koonan": ["Koonan", "Akakro 2", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Saboudougou": ["Saboudougou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Santa": ["Santa", "Alloko-Santa", "N'Gatta-Koffikro", "Saria-Santa"]
        },
        "Koro": {
            "Koro": ["Koro-Village", "Booko (limite)", "Borotou (limite)", "Kaniasso-Secteur", "Mahandiana", "Right-Bank-Koro", "Ségbéhoa-Koro", "Sokourani-Koro", "Tiékorodougou-Koro"],
            "Booko": ["Booko", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Borotou": ["Borotou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Bafing"]) divisions["Bafing"] = {};

    for (const [department, subPrefectures] of Object.entries(bafingData)) {
        if (!divisions["Bafing"][department]) divisions["Bafing"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Bafing"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Bafing region");
} else {
    console.log("Could not parse divisions");
}

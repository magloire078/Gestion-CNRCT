const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const kabadougouData = {
        "Odienné": {
            "Odienné": ["Odienné-Village", "Alloko-Koffikro (Campement)", "Banankoro", "Bassékodougou", "Bembasso", "Dioulatiédougou (limite)", "Gbansolo", "Gbo", "Goulia (limite)", "Kimbirila-Sud", "Logouana", "Massala", "N'Golo-Koffikro", "Odienné-Rural", "Samatiguila (limite)", "Ségbéhoa-Nord", "Sirana", "Sokourani", "Syllakoro", "Tougousso", "Washington"],
            "Dioulatiédougou": ["Dioulatiédougou", "Koro-Secteur", "Kourouba", "Nafana", "Right-Bank-Kaba", "Sémé"],
            "Kimbirila-Sud": ["Kimbirila-Sud", "Diégonépa-Nord", "Ggata-Kimbirila", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Samatiguila": {
            "Samatiguila": ["Samatiguila-Village", "Bindou", "Kébi", "Koriani", "Mahandiana-Sokourani", "Right-Bank-Samatiguila", "Ségbéhoa-Samatiguila", "Tiékorodougou"]
        },
        "Gbéléban": {
            "Gbéléban": ["Gbéléban-Village", "Baala", "Badiola", "Gbadi", "Gblétia-Nord", "Gouela", "Mahandougou", "Odienné-Secteur", "Seydougou (limite)"],
            "Seydougou": ["Seydougou", "Kabala", "Kohoma", "Niamana", "Ouaragahio-Secteur", "Right-Bank-Seydougou"]
        },
        "Madinani": {
            "Madinani": ["Madinani-Village", "Fengolo", "Gbon-Secteur", "Kabala", "Kokoun", "N'Golo-Kadiolo", "Ngoloblasso", "Right-Bank-Madinani", "Ségbéhoa-Est", "Tori", "Touroni"]
        },
        "Séguelon": {
            "Séguelon": ["Séguelon-Village", "Alloko-Séguelon", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Kabadougou"]) divisions["Kabadougou"] = {};

    for (const [department, subPrefectures] of Object.entries(kabadougouData)) {
        if (!divisions["Kabadougou"][department]) divisions["Kabadougou"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Kabadougou"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Kabadougou region");
} else {
    console.log("Could not parse divisions");
}

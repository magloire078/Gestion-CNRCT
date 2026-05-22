const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const guemonData = {
        "Duékoué": {
            "Duékoué": ["Duékoué-Village", "Alloko-Koffikro (Campement)", "Bagohouo (limite)", "Diégonépa-Guémon", "Fengolo", "Gblétia-Duékoué", "Ggata-Duékoué", "Gnamandji", "Guéhiébly (limite)", "N'Golo-Koffikro", "Right-Bank-Guémon", "Ségbéhoa-Nord", "Soko", "Wawrenou"],
            "Bagohouo": ["Bagohouo", "Diégonépa-Duékoué", "Ggata-Bagohouo", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Guéhiébly": ["Guéhiébly", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Bangolo": {
            "Bangolo": ["Bangolo-Village", "Bléniméouin (limite)", "Diéouzon (limite)", "Guinglo-Gbéan (limite)", "Right-Bank-Bangolo", "Ségbéhoa-Bangolo", "Sokourani", "Tiékorodougou-Est", "Zou (limite)"],
            "Bléniméouin": ["Bléniméouin", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Diéouzon": ["Diéouzon", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Guinglo-Gbéan": ["Guinglo-Gbéan", "Alloko-Guinglo", "N'Gatta-Koffikro", "Saria-Guinglo"],
            "Zou": ["Zou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Facobly": {
            "Facobly": ["Facobly-Village", "Kouan-Secteur", "Right-Bank-Facobly", "Ségbéhoa-Facobly", "Tiékorodougou-Ouest"],
            "Kouan": ["Kouan", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Kouibly": {
            "Kouibly": ["Kouibly-Village", "Alloko-Kouibly", "Ggata-Kouibly", "Gnamandji", "Kani", "N'Gatta-Koffikro", "Roa", "Saria-Kouibly", "Zaroko"]
        }
    };

    if (!divisions["Guémon"]) divisions["Guémon"] = {};

    for (const [department, subPrefectures] of Object.entries(guemonData)) {
        if (!divisions["Guémon"][department]) divisions["Guémon"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Guémon"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Guémon region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const cavallyData = {
        "Guiglo": {
            "Guiglo": ["Guiglo-Village", "Alloko-Koffikro (Campement)", "Béoué", "Bédiala-Secteur", "Diégonépa-Cavally", "Domobly", "Gblétia-Guiglo", "Ggata-Guiglo", "Gnamandji", "Kaade (limite)", "Nizahon", "Right-Bank-Cavally", "Ségbéhoa-Nord", "Soko", "Wawrenou", "Zagna"],
            "Kaade": ["Kaade", "Diégonépa-Guiglo", "Ggata-Kaade", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Nizahon": ["Nizahon", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Bloléquin": {
            "Bloléquin": ["Bloléquin-Village", "Diboké (limite)", "Doké (limite)", "Goya", "Right-Bank-Bloléquin", "Ségbéhoa-Bloléquin", "Sokourani", "Tiékorodougou-Est", "Zeaglo"],
            "Diboké": ["Diboké", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Doké": ["Doké", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Toulepleu": {
            "Toulepleu": ["Toulepleu-Village", "Bakoubly (limite)", "Méo (limite)", "Nezobly (limite)", "Right-Bank-Toulepleu", "Ségbéhoa-Toulepleu", "Tiékorodougou-Ouest", "Tiobly (limite)"],
            "Bakoubly": ["Bakoubly", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Méo": ["Méo", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Nezobly": ["Nezobly", "Alloko-Nezobly", "N'Gatta-Koffikro", "Saria-Nezobly"],
            "Tiobly": ["Tiobly", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Taï": {
            "Taï": ["Taï-Village", "Zagné (limite)", "Right-Bank-Taï", "Ségbéhoa-Taï"],
            "Zagné": ["Zagné", "Gblétia-Taï", "Gnamanou", "Godélilié", "Kpétoua", "Saoua"]
        }
    };

    if (!divisions["Cavally"]) divisions["Cavally"] = {};

    for (const [department, subPrefectures] of Object.entries(cavallyData)) {
        if (!divisions["Cavally"][department]) divisions["Cavally"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Cavally"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Cavally region");
} else {
    console.log("Could not parse divisions");
}

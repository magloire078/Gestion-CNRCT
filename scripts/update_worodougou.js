const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const worodougouData = {
        "Séguéla": {
            "Séguéla": ["Séguéla-Village", "Adjéhipalégnoa (Campement)", "Badiola", "Bagasséhoa (Secteur)", "Bemba", "Bobi (limite)", "Diarabana (limite)", "Dioulatiédougou-Est", "Dualla (limite)", "Ganan", "Gbazi-Woroba", "Ggata-Séguéla", "Gnamandji", "Kamalo (limite)", "Kani-Secteur", "Massala (limite)", "N'Golo-Koffikro", "Ségbéhoa-Nord", "Sifié (limite)", "Soko", "Sifié-Rural", "Suisso", "Wawrenou"],
            "Bobi": ["Bobi", "Diégonépa-Woroba", "Ggata-Bobi", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Diarabana": ["Diarabana", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Dualla": ["Dualla", "Akakro-Koyaka", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Kamalo": ["Kamalo", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Massala": ["Massala", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Sifié": ["Sifié", "Alloko-Sifié", "N'Gatta-Koffikro", "Saria-Sifié"]
        },
        "Kani": {
            "Kani": ["Kani-Village", "Djibrosso (limite)", "Fadiadougou (limite)", "Gbêkê-Secteur", "Gblétia-Woroba", "Gbon-Secteur", "Kébi-Woroba", "Mahandiana", "Morondo (limite)", "Right-Bank-Kani", "Ségbéhoa-Kani", "Sokourani", "Tiékorodougou-Est"],
            "Djibrosso": ["Djibrosso", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Fadiadougou": ["Fadiadougou", "Akakro 2", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Morondo": ["Morondo", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Worodougou"]) divisions["Worodougou"] = {};

    for (const [department, subPrefectures] of Object.entries(worodougouData)) {
        if (!divisions["Worodougou"][department]) divisions["Worodougou"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Worodougou"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Worodougou region");
} else {
    console.log("Could not parse divisions");
}

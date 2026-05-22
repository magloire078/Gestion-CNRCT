const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const hautSassandraData = {
        "Daloa": {
            "Daloa": ["Daloa-Ville/Village", "Alloko-Koffikro (Campement)", "Bédiala (limite)", "Gadouan (limite)", "Ggata-Daloa", "Gnamandji", "Gonaté (limite)", "N'Golo-Koffikro", "Right-Bank-Sassandra", "Ségbéhoa-Centre", "Soko", "Wawrenou", "Zaïbo (limite)"],
            "Bédiala": ["Bédiala", "Diégonépa-Sassandra", "Ggata-Bédiala", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Gadouan": ["Gadouan", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Gonaté": ["Gonaté", "Akakro-Bété", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Zaïbo": ["Zaïbo", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Issia": {
            "Issia": ["Issia-Village", "Boguédia (limite)", "Gblétia-Sassandra", "Iboguhé (limite)", "Namané (limite)", "Right-Bank-Issia", "Ségbéhoa-Issia", "Saïoua (limite)", "Sokourani", "Tiékorodougou-Est"],
            "Boguédia": ["Boguédia", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Iboguhé": ["Iboguhé", "Bodocipa-Sud", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Saïoua": ["Saïoua", "Alloko-Saïoua", "N'Gatta-Koffikro", "Saria-Saïoua"]
        },
        "Vavoua": {
            "Vavoua": ["Vavoua-Village", "Bazra-Nattis (limite)", "Dania (limite)", "Kétro-Bassam (limite)", "Right-Bank-Vavoua", "Ségbéhoa-Vavoua", "Tiékorodougou-Nord"],
            "Dania": ["Dania", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Zoukougbeu": {
            "Zoukougbeu": ["Zoukougbeu-Village", "Alloko-Zoukougbeu", "Ggata-Zoukougbeu", "Gnamandji", "Kani", "N'Gatta-Koffikro", "Roa", "Saria-Zoukougbeu", "Zaroko"]
        }
    };

    if (!divisions["Haut-Sassandra"]) divisions["Haut-Sassandra"] = {};

    for (const [department, subPrefectures] of Object.entries(hautSassandraData)) {
        if (!divisions["Haut-Sassandra"][department]) divisions["Haut-Sassandra"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Haut-Sassandra"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Haut-Sassandra region");
} else {
    console.log("Could not parse divisions");
}

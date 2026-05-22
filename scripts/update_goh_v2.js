const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const gohData = {
        "Gagnoa": {
            "Gagnoa": ["Gagnoa-Village", "Alloko-Koffikro (Campement)", "Baoulé-Koffikro", "Bayota (limite)", "Bédiala-Secteur", "Diégonépa (limite)", "Dougroupalégnoa (limite)", "Galebré (limite)", "Ggata-Gagnoa", "Gnamandji", "Guibéroua (limite)", "Kpapekou", "Mahibouo", "N'Golo-Koffikro", "Ouragahio (limite)", "Right-Bank-Gôh", "Ségbéhoa-Centre", "Soko", "Tipadipa", "Wawrenou", "Yopohé"],
            "Bayota": ["Bayota", "Diégonépa-Gagnoa", "Ggata-Bayota", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Diégonépa": ["Diégonépa", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Dougroupalégnoa": ["Dougroupalégnoa", "Akakro-Bété", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Galebré": ["Galebré", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Guibéroua": ["Guibéroua", "Alloko-Guibéroua", "N'Gatta-Koffikro", "Saria-Guibéroua"],
            "Ouragahio": ["Ouragahio", "Bodocipa-Sud", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Oumé": {
            "Oumé": ["Oumé-Village", "Diégonépa-Est", "Diégonépa-Oumé", "Gblétia-Oumé", "Guepahouo (limite)", "Kokoumbo-Secteur", "Morokro-Secteur", "Right-Bank-Oumé", "Ségbéhoa-Est", "Sokourani", "Tiékorodougou-Est", "Tonla (limite)"],
            "Guepahouo": ["Guepahouo", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Tonla": ["Tonla", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Gôh"]) divisions["Gôh"] = {};

    for (const [department, subPrefectures] of Object.entries(gohData)) {
        if (!divisions["Gôh"][department]) divisions["Gôh"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Gôh"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Gôh region");
} else {
    console.log("Could not parse divisions");
}

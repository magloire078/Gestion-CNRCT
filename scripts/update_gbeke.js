const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const gbekeData = {
        "Bouaké": {
            "Bouaké": ["Bouaké-Village", "Ahoko", "Ahounou", "Ahougnansou", "Akakro", "Alloko-Koffikro", "Angoua-Kouassikro", "Assengou", "Assié-Kouamékro", "Bamoro", "Belakro", "Bounda", "Brobo (limite)", "Diabo (limite)", "Djebonoua (limite)", "Gbofia-Gbêkê", "Kahankro", "Kami", "Kango", "Kondrokro", "Kouassikro", "N'Gattakro", "N'Zikro", "Olihio", "Ségbéhoa-Centre", "Soko", "Solou-Gbêkê", "Tieplé", "Wawrenou"],
            "Brobo": ["Brobo", "Abou-Secteur", "Attakro", "Bodocipa-Gbêkê", "Diégonépa-Est", "Ggata-Brobo", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Djebonoua": ["Djebonoua", "Adiékro", "Assanou", "Assèkro", "Gnamanou", "Kpapekou-Gbêkê", "Lengbré", "N'Gatta-Koffikro", "Saria-Gbêkê", "Toa"]
        },
        "Sakassou": {
            "Sakassou": ["Sakassou-Village", "Agba-Kouassikro", "Ahua", "Akoti", "Allokokro", "Amian-Kouassikro", "Andianou", "Assandrè", "Assrikro", "Dadié-Kouassikro", "Goli", "Kanguélilié", "Kpéprou", "N'Gatta-Kouassikro", "N'Gbin", "Right-Bank-Sakassou", "Ségbéhoa-Ouest", "Soko-Sakassou", "Tow"],
            "Ayaou-Sran": ["Ayaou-Sran", "Akakro 2", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Béoumi": {
            "Béoumi": ["Béoumi-Village", "Aka-Koffikro", "Alloko-Koffikro 2", "Angoda-Secteur", "Bodou", "Central-Kossou", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kondrobo", "Kouadiokro", "Marabadiassa (limite)", "Sakihoro", "Toa-Béoumi"],
            "Marabadiassa": ["Marabadiassa", "Akakro-Kodè", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Botro": {
            "Botro": ["Botro-Village", "Abrikro", "Diabo (limite)", "Diangokro-Secteur", "Elinso", "Ggata-Botro", "Kangrassou", "Krofo", "Lomo-Nord", "N'Gattakro", "N'Zida", "Right-Bank-Botro", "Ségbéhoa-Nord"],
            "Diabo": ["Diabo", "Adiékro-Diabo", "Agbaou", "Kondrokro", "N'Gatta-Koffikro", "Saria-Diabo"]
        }
    };

    if (!divisions["Gbêkê"]) divisions["Gbêkê"] = {};

    for (const [department, subPrefectures] of Object.entries(gbekeData)) {
        if (!divisions["Gbêkê"][department]) divisions["Gbêkê"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Gbêkê"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Gbêkê region");
} else {
    console.log("Could not parse divisions");
}

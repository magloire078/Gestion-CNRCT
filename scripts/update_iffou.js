const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const iffouData = {
        "Daoukro": {
            "Daoukro": ["Daoukro-Village", "Abidjan-Kouassikro", "Agni-Assikasso", "Ahougnanou", "Akakro", "Allokokro", "Amian-Kouassikro", "Anoumaba (limite)", "Assanekro", "Benanou", "Dengbé", "Diangokro-Secteur", "Ettrokro (limite)", "Ggata-Daoukro", "Koutoukro", "Lekikro", "N'Gattakro", "Ouellé-Secteur", "Pepressou", "Samanza", "Ségbéhoa-Est"],
            "Ettrokro": ["Ettrokro", "Amoakro", "Assikasso", "Ekra-Koffikro", "Gnamanou", "Kpapekou-Iffou", "N'Gatta-Koffikro", "Saria-Iffou"],
            "Samanza": ["Samanza", "Akakro 2", "Bodocipa", "Diégonépa-Iffou", "Gnagboya", "Godélilié", "Kpétoua", "Saoua"]
        },
        "M'Bahiakro": {
            "M'Bahiakro": ["M'Bahiakro-Village", "Agba-Kouassikro", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Bonguéra (limite)", "Dangou", "Dadié-Kouassikro", "Goli", "Kondrokro", "Kouassi-Kouassikro (limite)", "N'Gatta-Kouassikro", "N'Gbin", "N'Zikro", "Ségbéhoa", "Soko", "Wawrenou"],
            "Bonguéra": ["Bonguéra", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Prikro": {
            "Prikro": ["Prikro-Village", "Abidjan-Prikro", "Allokokro", "Anianou", "Assikasso-Nord", "Boli-Prikro", "Famienkro", "Ggata-Prikro", "Koffikro", "Kpapekou", "Nafana", "Right-Bank-Prikro", "Ségbéhoa-Nord", "Tow"],
            "Famienkro": ["Famienkro", "Akakro-Prikro", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Ouellé": {
            "Ouellé": ["Ouellé-Village", "Akakro-Ouellé", "Alloko-Koffikro", "Amian-Koffikro", "Ananda", "Assolo", "Baléko", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Ananda": ["Ananda", "Ggata-Ouellé", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        }
    };

    if (!divisions["Iffou"]) divisions["Iffou"] = {};

    for (const [department, subPrefectures] of Object.entries(iffouData)) {
        if (!divisions["Iffou"][department]) divisions["Iffou"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Iffou"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Iffou region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const agnebyTiassaData = {
        "Agboville": {
            "Agboville": ["Agboville-Village", "Aboudé", "Adahou", "Agou (limite)", "Ananguié", "Angaho", "Armébé", "Arrah-Secteur", "Azaguié (limite)", "Bécédi", "Biti", "Boli", "Chépo", "Diangokro-Sud", "Ery-Makouguié", "Gbofia", "Grand-Morié", "Grand-Yapo", "Loviguié", "Massandji", "N'Gattakro", "Offoumpo", "Oress-Krobou", "Rubino", "Ségbéhoa-Lagunes"],
            "Aboudé": ["Aboudé-Mandéké", "Aboudé-Kouassikro", "Attécoubé-Secteur", "Gnamanou", "Kpapekou-Lagunes", "N'Gatta-Koffikro", "Saria-Lagunes"],
            "Ananguié": ["Ananguié", "Akakro", "Bodocipa", "Diégonépa-Lagunes", "Gnagboya", "Godélilié", "Kpétoua", "Saoua"],
            "Grand-Morié": ["Grand-Morié", "Azaguié-Blé", "Ggata-Agboville", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Rubino": ["Rubino", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Assikasso-Sud", "Dadié-Kouassikro", "Goli", "Kondrokro", "N'Gatta-Kouassikro", "N'Gbin", "Ségbéhoa", "Soko", "Wawrenou"]
        },
        "Tiassalé": {
            "Tiassalé": ["Tiassalé-Village", "Ahua", "Akakro 2", "Allokokro", "Amian-Kouassikro", "Batélébré", "Binao", "Boli-Tiassalé", "Botindé", "Ggata-Tiassalé", "Kpapekou", "Morokro", "N'Zidan", "Right-Bank-Tiassalé", "Sago-Secteur", "Ségbéhoa-Nord", "Sikensi (limite)", "Taabo-Secteur", "Tow"],
            "Morokro": ["Morokro", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "N'Douci": ["N'Douci", "Abeve", "Boussoué", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Sikensi": {
            "Sikensi": ["Sikensi-Village", "Abié", "Badasso", "Bakanou", "Bécédi 2", "Braffouéby", "Elibou", "Gomon", "Katadji", "Sahuyé", "Soublaké"]
        },
        "Taabo": {
            "Taabo": ["Taabo-Village", "Ahondo", "Kotiessou", "Léléblé", "Pacobo", "Right-Bank-Taabo", "Ségbéhoa-Sud", "Taabo-Cité"]
        }
    };

    if (!divisions["Agnéby-Tiassa"]) divisions["Agnéby-Tiassa"] = {};

    for (const [department, subPrefectures] of Object.entries(agnebyTiassaData)) {
        if (!divisions["Agnéby-Tiassa"][department]) divisions["Agnéby-Tiassa"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Agnéby-Tiassa"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Agnéby-Tiassa region");
} else {
    console.log("Could not parse divisions");
}

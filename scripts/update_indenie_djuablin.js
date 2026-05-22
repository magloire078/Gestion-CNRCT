const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const indenieDjuablinData = {
        "Abengourou": {
            "Abengourou": ["Abengourou-Village", "Adaou", "Adonikro", "Agnizankro", "Akoizankro", "Amélékia", "Aniassué", "Appoisso", "Appoueba", "Assehoun", "Assièkro", "Bédiékro", "Bossématié", "Ebilassokro", "Ehuikro", "Kodjinan", "Koitienkro", "Niablé (limite)", "Ségbéhoa-Est", "Yakassé-Féeyassé", "Zaranou"],
            "Amélékia": ["Amélékia", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Dadié-Kouassikro", "Goli", "Kondrokro", "N'Gatta-Kouassikro", "N'Gbin", "Soko", "Wawrenou"],
            "Aniassué": ["Aniassué", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Niablé": ["Niablé", "Diégonépa-Est", "Ggata-Niablé", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Agnibilékrou": {
            "Agnibilékrou": ["Agnibilékrou-Village", "Akadamé", "Akoko", "Assofou", "Assuéfry (limite)", "Duffrébo", "Kétesso", "Kongodja", "N'Ggasso", "Right-Bank-Agnibilékrou", "Ségbéhoa-Nord", "Tanguelan", "Yobouakro"],
            "Duffrébo": ["Duffrébo", "Akakro-Djuablin", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Tanguelan": ["Tanguelan", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Bettié": {
            "Bettié": ["Bettié-Village", "Abradinou", "Akrébi", "Attokro", "Biéby-Secteur", "Diangokro-Sud", "Elinso", "Ggata-Bettié", "Kossonoukro", "Right-Bank-Bettié", "Ségbéhoa-Sud"]
        }
    };

    if (!divisions["Indénié-Djuablin"]) divisions["Indénié-Djuablin"] = {};

    for (const [department, subPrefectures] of Object.entries(indenieDjuablinData)) {
        if (!divisions["Indénié-Djuablin"][department]) divisions["Indénié-Djuablin"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Indénié-Djuablin"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Indénié-Djuablin region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const moronouData = {
        "Bongouanou": {
            "Bongouanou": ["Bongouanou-Village", "Abongoua", "Agba-Kouassikro", "Ahounan", "Akakro", "Allokokro", "Amian-Kouassikro", "Andé (limite)", "Anoumaba", "Assié-Kouamékro", "Assikasso", "Banabo", "Bouadikro", "Diangokro-Secteur", "Elinso", "Ggata-Bongouanou", "Kangrassou", "Kotobi", "N'Gattakro", "N'Zikro", "Ségbéhoa-Moronou"],
            "Andé": ["Andé", "Agboville-Secteur", "Amoakro", "Ekra-Koffikro", "Gnamanou", "Kpapekou-Moronou", "N'Gatta-Koffikro", "Saria-Moronou"],
            "Anoumaba": ["Anoumaba", "Akakro 2", "Bodocipa", "Diégonépa-Moronou", "Gnagboya", "Godélilié", "Kpétoua", "Saoua"]
        },
        "Arrah": {
            "Arrah": ["Arrah-Village", "Abongoua-Arrah", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Assikasso-Nord", "Bonguéra-Secteur", "Dadié-Kouassikro", "Goli", "Kondrokro", "Kotobi (limite)", "Kouassi-Kouassikro", "N'Gatta-Kouassikro", "N'Gbin", "Ségbéhoa", "Soko", "Wawrenou"],
            "Kotobi": ["Kotobi", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "M'Batto": {
            "M'Batto": ["M'Batto-Village", "Ahua", "Allokokro", "Anianou", "Assikasso-Sud", "Boli-M'Batto", "Diangokro", "Ggata-M'Batto", "Koffikro", "Kpapekou", "N'Zidan", "Right-Bank-M'Batto", "Ségbéhoa-Sud", "Tiémélékro (limite)", "Tow"],
            "Tiémélékro": ["Tiémélékro", "Akakro-M'Batto", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        }
    };

    if (!divisions["Moronou"]) divisions["Moronou"] = {};

    for (const [department, subPrefectures] of Object.entries(moronouData)) {
        if (!divisions["Moronou"][department]) divisions["Moronou"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Moronou"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Moronou region");
} else {
    console.log("Could not parse divisions");
}

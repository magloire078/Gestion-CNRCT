const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const nziData = {
        "Dimbokro": {
            "Dimbokro": ["Dimbokro-Village", "Abigui", "Ahua", "Ahounan", "Akambonou", "Amian-Kouassikro", "Andianou", "Angouakro", "Booré-Aboisso", "Diangokro (limite)", "Didié-Kouassikro", "Ediakro", "Kangrassou", "Koffi-Ahoussoukro", "Koloko", "Kpégro", "Krokokro", "N'Gam", "N'Zikro", "Tangoumansou", "Troumabo", "Wawrenou"],
            "Abigui": ["Abigui", "Agba-Kouassikro", "Ediakro 2", "Ggata-Abigui", "Langba", "N'Gattakro", "Pokoukro", "Toa"],
            "Diangokro": ["Diangokro", "Adou-Koffikro", "Assamouan", "Bériaboukro", "Elinso", "Gbofia-Est", "N'Zidan", "Right-Bank-Diangokro", "Ségbéhoa-N'Zi"]
        },
        "Bocanda": {
            "Bocanda": ["Bocanda-Village", "Agba-Kouassikro", "Ahali", "Aka-Kouassikro", "Allokokro", "Amian-Koffikro", "Andianou 2", "Assika-Koulalého", "Bengassou", "Diégonépa-Nord", "Gnaliépa-N'Zi", "Gnamanou", "Goli", "Koliakro", "Konan-Kokorekro", "Kouadiokro", "Kpapekou-N'Zi", "Mahounou", "N'Gatta-Koffikro", "N'Gbin-Bocanda", "Saria", "Ségbéhoa", "Susu", "Tefredji", "Zégo"],
            "Bengassou": ["Bengassou", "Alloko-Koffikro", "Bonikro", "Gnamakoa", "Kpétoua", "N'Gatta-Kouassikro", "N'Zikro"],
            "Kouadioblékro": ["Kouadioblékro", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Kouassi-Kouassikro": {
            "Kouassi-Kouassikro": ["Kouassi-Kouassikro", "Allokokro 2", "Assanou", "Bodocipa", "Diégonépa 2", "Gnagboya", "Godélilié", "Kofikro", "Kpapekou 2", "M'Bahiakro-Secteur", "N'Gran", "Polonou"],
            "M'Bahiakro-Secteur": ["Boli-N'Zi", "Ggata-Nord", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        }
    };

    if (!divisions["N'Zi"]) divisions["N'Zi"] = {};

    for (const [department, subPrefectures] of Object.entries(nziData)) {
        if (!divisions["N'Zi"][department]) divisions["N'Zi"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["N'Zi"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated NZi region");
} else {
    console.log("Could not parse divisions");
}

const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const meData = {
        "Adzopé": {
            "Adzopé": ["Adzopé-Village", "Adonkoi", "Agbaou", "Ahéoua", "Ananguié (Médi)", "Annépé", "Assikoi", "Biasso", "Bouapé", "Duquesne-Cremona", "Massandji", "Miadzin", "Moapé", "N'Gassan", "N'Gattakro", "N'Zikro", "Ségbéhoa-Mé"],
            "Agou": ["Agou", "Aboudé-Secteur", "Amoakro", "Diangokro-Est", "Ekra-Koffikro", "Gnamanou", "Kpapekou-Mé", "N'Gatta-Koffikro", "Saria-Mé"],
            "Assikoi": ["Assikoi", "Akakro", "Bodocipa", "Diégonépa-Mé", "Gnagboya", "Godélilié", "Kpétoua", "Saoua"]
        },
        "Akoupé": {
            "Akoupé": ["Akoupé-Village", "Afféry (limite)", "Agbaou-Akoupé", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Bacon", "Bécouéfin", "Dadié-Kouassikro", "Goli", "Kodioussou", "Kondrokro", "N'Gatta-Kouassikro", "N'Gbin", "Ségbéhoa", "Soko", "Wawrenou"],
            "Afféry": ["Afféry", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Bacon": ["Bacon", "Ggata-Akoupé", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Alépé": {
            "Alépé": ["Alépé-Village", "Ahoutou", "Akouré", "Allokokro", "Amian-Kouassikro", "Andou-M'Batto", "Angoda-Secteur", "Biasso-Sud", "Danguira", "Ggata-Alépé", "Grand-Alépé", "Kpapekou", "M'Batto-Bouaké", "Memni", "Monga", "Montezo", "N'Zidan", "Right-Bank-Alépé", "Ségbéhoa-Sud"],
            "Danguira": ["Danguira", "Akakro-Alépé", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Memni": ["Memni", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Yakassé-Attobrou": {
            "Yakassé-Attobrou": ["Yakassé-Attobrou", "Abongoua", "Biéby", "Diangokro-Secteur", "Elinso", "Fieassé", "Ggata-Yakassé", "Kangrassou", "N'Gattakro", "N'Zikro", "Ségbéhoa-Nord"]
        }
    };

    if (!divisions["Mé"]) divisions["Mé"] = {};

    for (const [department, subPrefectures] of Object.entries(meData)) {
        if (!divisions["Mé"][department]) divisions["Mé"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Mé"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Mé region");
} else {
    console.log("Could not parse divisions");
}

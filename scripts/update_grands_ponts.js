const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const grandsPontsData = {
        "Dabou": {
            "Dabou": ["Dabou-Village", "Agneby", "Ahua", "Akradi", "Allaba", "Bodou", "Bouboury", "Cosrou", "Débrimou", "Gbougbo", "Kanda", "Lopou (limite)", "Mooussou", "N'Gattakro", "Orbaff", "Pass", "Ségbéhoa-Grands-Ponts", "Toupah", "Vieil-Ayou"],
            "Lopou": ["Lopou", "Alloko-Koffikro", "Amian-Koffikro", "Andianou", "Dadié-Kouassikro", "Goli", "Kondrokro", "N'Gatta-Kouassikro", "N'Gbin", "Ségbéhoa", "Soko", "Wawrenou"],
            "Toupah": ["Toupah", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Jacqueville": {
            "Jacqueville": ["Jacqueville-Village", "Abreby", "Addah", "Avagou", "Bobolo-Lagune", "Grand-Jack", "M'Bokrou", "N'Djem", "Right-Bank-Jacqueville", "Sassako-Bégnini", "Taboth", "Tolou"]
        },
        "Grand-Lahou": {
            "Grand-Lahou": ["Grand-Lahou-Village", "Agba", "Ahounan", "Bakanda", "Braffedon", "Diangokro-Secteur", "Elinso", "Ggata-Lahou", "Groguida", "Irobo", "Lahou-Kpanda", "Liboli", "Nandibo", "N'Zida", "Right-Bank-Lahou", "Ségbéhoa-Sud", "Tiégba"],
            "Irobo": ["Irobo", "Akakro-Lahou", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "N'Zida": ["N'Zida", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Grands-Ponts"]) divisions["Grands-Ponts"] = {};

    for (const [department, subPrefectures] of Object.entries(grandsPontsData)) {
        if (!divisions["Grands-Ponts"][department]) divisions["Grands-Ponts"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Grands-Ponts"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Grands-Ponts region");
} else {
    console.log("Could not parse divisions");
}

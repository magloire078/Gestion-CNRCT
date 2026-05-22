const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const gontougoData = {
        "Bondoukou": {
            "Bondoukou": ["Bondoukou-Village", "Alloko-Koffikro (Campement)", "Appimandoum", "Bondo-Secteur", "Ggata-Bondoukou", "Gnamandji", "Gouméré (limite)", "Laoudi-Ba (limite)", "N'Golo-Koffikro", "Right-Bank-Zanzan", "Ségbéhoa-Nord", "Soko (poste frontière)", "Sorobango (limite)", "Taoudi (limite)", "Wawrenou", "Yézimala"],
            "Gouméré": ["Gouméré", "Diégonépa-Zanzan", "Ggata-Gouméré", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Laoudi-Ba": ["Laoudi-Ba", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Sorobango": ["Sorobango", "Akakro-Zanzan", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Taoudi": ["Taoudi", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Tanda": {
            "Tanda": ["Tanda-Village", "Amanvi (limite)", "Diamba (limite)", "Gblétia-Zanzan", "Right-Bank-Tanda", "Ségbéhoa-Tanda", "Sokourani", "Tiékorodougou-Est"],
            "Amanvi": ["Amanvi", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Diamba": ["Diamba", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Koun-Fao": {
            "Koun-Fao": ["Koun-Fao-Village", "Kouassi-Datékro (limite)", "Right-Bank-Koun", "Ségbéhoa-Koun", "Tiékorodougou-Ouest"],
            "Kouassi-Datékro": ["Kouassi-Datékro", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Sandégué": {
            "Sandégué": ["Sandégué-Village", "Alloko-Sandégué", "N'Gatta-Koffikro", "Saria-Sandégué"]
        },
        "Transua": {
            "Transua": ["Transua-Village", "Assuéfry (limite)", "Right-Bank-Transua"],
            "Assuéfry": ["Assuéfry", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        }
    };

    if (!divisions["Gontougo"]) divisions["Gontougo"] = {};

    for (const [department, subPrefectures] of Object.entries(gontougoData)) {
        if (!divisions["Gontougo"][department]) divisions["Gontougo"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Gontougo"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Gontougo region");
} else {
    console.log("Could not parse divisions");
}

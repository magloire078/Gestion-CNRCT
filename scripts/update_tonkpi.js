const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const tonkpiData = {
        "Man": {
            "Man": ["Man-Village", "Alloko-Koffikro (Campement)", "Bogouiné (limite)", "Diégonépa-Ouest", "Fagnampleu", "Gbangbégouiné (limite)", "Ggata-Man", "Gnamandji", "Gotongouiné", "Kiélé", "N'Golo-Koffikro", "Podiagouiné", "Right-Bank-Tonkpi", "Sangouiné (limite)", "Ségbéhoa-Nord", "Soko", "Wawrenou", "Yapleu", "Zagoué"],
            "Bogouiné": ["Bogouiné", "Diégonépa-Man", "Ggata-Bogouiné", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Gbangbégouiné": ["Gbangbégouiné", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Sangouiné": ["Sangouiné", "Akakro-Dan", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        },
        "Danané": {
            "Danané": ["Danané-Village", "Daleu (limite)", "Gblétia-Tonkpi", "Kouan-Houlé (limite)", "Mahapleu (limite)", "Right-Bank-Danané", "Ségbéhoa-Danané", "Seileu", "Sokourani", "Tiékorodougou-Est"],
            "Daleu": ["Daleu", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Kouan-Houlé": ["Kouan-Houlé", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Mahapleu": ["Mahapleu", "Gblétia-Danané", "Gnamanou", "Godélilié", "Kpétoua", "Saoua"]
        },
        "Biankouma": {
            "Biankouma": ["Biankouma-Village", "Blapleu (limite)", "Gbon-Secteur", "Goba (limite)", "Gnanlé (limite)", "Kanta", "Kpata-Tourakro", "Santa (limite)", "Right-Bank-Biankouma", "Ségbéhoa-Biankouma", "Tiékorodougou-Ouest"],
            "Blapleu": ["Blapleu", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"],
            "Goba": ["Goba", "Bodocipa-Nord", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Gnanlé": ["Gnanlé", "Alloko-Gnanlé", "N'Gatta-Koffikro", "Saria-Gnanlé"],
            "Santa": ["Santa", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Zouan-Hounien": {
            "Zouan-Hounien": ["Zouan-Hounien-Village", "Banneu (limite)", "Bin-Houyé (limite)", "Teapleu (limite)", "Right-Bank-Zouan", "Ségbéhoa-Zouan"],
            "Banneu": ["Banneu", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"],
            "Bin-Houyé": ["Bin-Houyé", "Alloko-Bin", "N'Gatta-Koffikro", "Saria-Bin"],
            "Teapleu": ["Teapleu", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Sipilou": {
            "Sipilou": ["Sipilou-Village", "Bloma", "Ggata-Sipilou", "Gnamandji", "Kani", "N'Gatta-Koffikro", "Roa", "Saria-Sipilou", "Zaroko"]
        },
        "Logoualé": {
            "Logoualé": ["Logoualé-Village", "Ggata-Logoualé", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"]
        }
    };

    if (!divisions["Tonkpi"]) divisions["Tonkpi"] = {};

    for (const [department, subPrefectures] of Object.entries(tonkpiData)) {
        if (!divisions["Tonkpi"][department]) divisions["Tonkpi"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Tonkpi"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Tonkpi region");
} else {
    console.log("Could not parse divisions");
}

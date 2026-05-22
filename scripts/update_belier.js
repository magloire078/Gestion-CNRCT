const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const belierData = {
        "Toumodi": {
            "Toumodi": ["Toumodi-Village", "Abli", "Agbagnansou", "Ahua", "Akakro", "Angoda (limite)", "Assounvoué", "Benzokro", "Binava", "Kpouèbo (limite)", "Lomo", "Mougnan", "Ouaouakro", "Pokoukro", "Sakassou-Secteur"],
            "Angoda": ["Angoda", "Gbofia", "Kpové-Village", "Lomo-Nord", "N'Gattakro", "Poungbè", "Sahabo", "Yaakro"],
            "Kpouèbo": ["Kpouèbo", "Assakra", "Diambo", "Goli", "Koda", "Kpohi", "N'Gban-Kouassikro", "Pokou-Kouassikro"]
        },
        "Tiébissou": {
            "Tiébissou": ["Tiébissou-Village", "Ahougnansou", "Akoti", "Assansou", "Bofia", "Gbomizambo", "Kondé-Yaokro", "Minankro", "N'Gattadolikro", "Prollo-Secteur", "Sakiaré (limite)", "Taki-Kouassikro", "Yakpalo"],
            "Lomokro": ["Lomokro", "Abrikro", "Dozo-Secteur", "Goli-Secteur", "Kpékro", "N'Gbin"]
        },
        "Didiévi": {
            "Didiévi": ["Didiévi-Village", "Allokokro", "Attokro", "Boli", "Goliou", "Kofikro", "Kpapekou-Secteur", "N'Gran", "Polonou", "Right-Bank-Didiévi", "Ségbéhoa", "Yaakro"],
            "Boli": ["Boli", "Attégouakro-Secteur", "Ggata", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Molonou-Blé": ["Molonou", "Akakro-Blé", "Bodocipa", "Diégonépa", "Gnagboya", "Gnamanou", "Godélilié", "Kpétoua", "Saoua", "Saria"]
        },
        "Djékanou": {
            "Djékanou": ["Djékanou-Village", "Assabonou", "Booré", "Diambo 2", "Ggata-Djékanou", "Kokumbo (limite)", "Tolou-Djékanou"],
            "Kokumbo": ["Kokumbo", "Akakro 2", "Kimoukro", "Kpouèbo 2", "N'Gatta-Koffikro", "Ségbéhoa-Sud"]
        }
    };

    if (!divisions['Bélier']) divisions['Bélier'] = {};

    for (const [department, subPrefectures] of Object.entries(belierData)) {
        if (!divisions['Bélier'][department]) divisions['Bélier'][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions['Bélier'][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully updated Bélier region');
} else {
    console.log('Could not parse divisions');
}

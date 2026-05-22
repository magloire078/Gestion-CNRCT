const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const lohDjibouaData = {
        "Divo": {
            "Divo": ["Divo-Village", "Abohio", "Bada", "Blé", "Boubo", "Center-Palme", "Chiépo", "Dagrom", "Dialle", "Dioulabougou-Rural", "Djahakro", "Gabiadji-Divo", "Grobiakoko", "Grobiassoumé", "Hermankono-Garo", "Labodougou", "Léhiri-Kpanda", "Madichal", "Nebo", "Noé", "Standard-Divo", "Tableguikro", "Yocoboué (limite)", "Zégo"],
            "Didoko": ["Didoko", "Agboville-Divo", "Biasso", "Dairo-Didoko", "Gnamanou", "Godé", "Grobiakoko 2", "Kpapekou", "Léléblé", "Lougbo", "Niaprahio"],
            "Hiré": ["Hiré", "Akakro", "Bouakako", "Douville", "Gangarigbé", "Kagbé", "Kpata", "Oumé-Secteur", "Zaroko", "Zégo-Hiré"],
            "Nebo": ["Nebo", "Braboré", "Diégonépa", "Gnagbodougnoa", "Gnakoubouo", "Godélilié", "Logorou", "Sinfra-Campement"],
            "Ogoudou": ["Ogoudou", "Agboville-Secteur", "Braboré 2", "Djékouamékro", "Gly", "Hermankono-Dies", "Kpétoua", "Local-Garo"]
        },
        "Lakota": {
            "Lakota": ["Lakota-Village", "Akabréboua", "Dahiri (limite)", "Djidjoko", "Djigbahi", "Gnakoubouo", "Gogné", "Gragbalilié", "Koudoulilié", "Kpapekou", "Léléboua", "Ligrohouan", "Niambézaria", "Niaprahio", "Oupoyo (limite)", "Sago-Secteur", "Saria", "Yocoboué (secteur nord)", "Zako", "Zégo"],
            "Djidji": ["Djidji", "Dalilié", "Diégonépa", "Gbagbam", "Gnatroa", "Goliou", "Grand-Gaza", "Kpétoua", "Saoua", "Tiepa"],
            "Goudouko": ["Goudouko", "Abohio", "Bako", "Gnagboya", "Gnamanou", "Godélilié", "Kadéko", "Niouboua", "Solou"],
            "Niambézaria": ["Niambézaria", "Djidjoko 2", "Ggata", "Gnamakoa", "Gobro", "Grigbéhoa", "Kpoda", "Tagbayo"]
        },
        "Guitry": {
            "Guitry": ["Guitry-Village", "Babokon", "Bassa", "Bobolo", "Dairo", "Dayorokro", "Douoda", "Ggata-Guitry", "Kouta", "Lalo", "N'Zida", "Right-Bank-Guitry", "Soublaké", "Téhiri", "Yocoboué (limite)"],
            "Dairo-Didoko": ["Dairo", "Biakou", "Bodocipa", "Gnagbodougnoa", "Gnamanou", "Hermankono", "Kpoda", "Sakihoro"]
        }
    };

    if (!divisions['Lôh-Djiboua']) divisions['Lôh-Djiboua'] = {};

    for (const [department, subPrefectures] of Object.entries(lohDjibouaData)) {
        if (!divisions['Lôh-Djiboua'][department]) divisions['Lôh-Djiboua'][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions['Lôh-Djiboua'][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully updated Lôh-Djiboua region');
} else {
    console.log('Could not parse divisions');
}

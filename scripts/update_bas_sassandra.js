const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const sanPedroData = {
        "San-Pédro": {
            "San-Pédro": ["San-Pédro-Village", "Baba", "Digbou", "Douopo", "Gabiadji (limite)", "Grand-Béréby (secteur est)", "Klotou", "Mapri", "Poro", "Saint-Paul"],
            "Gabiadji": ["Gabiadji", "Blohorn", "Boua", "Dozo", "Gnanbato", "Hannah", "Houphouët-Boigny", "Inagbehi", "Kpotè", "Mapri 2", "Monogaga (secteur nord)", "Scaf", "Touih (limite)"],
            "Grand-Béréby": ["Grand-Béréby", "Adjé", "Boubélé", "Dahié", "Dawa", "Dogbo", "Kablaké", "Mani", "Ménéké", "Néro-Mer", "Néro-Village", "Ouro", "Pitiko", "Roc", "Séwéké", "Taclo"],
            "Touih": ["Touih", "Berkani", "Dozon", "Gbagnégnoa", "Gnakoragui", "Kounouko", "Léléblé", "Sinfra-Campement"]
        },
        "Tabou": {
            "Tabou": ["Tabou-Village", "Bliéron", "Cape-Palmas", "Daoubli", "Kablaké", "Néro", "Olodio (limite)", "Prollo", "Ranou", "Soublaké", "Tolou"],
            "Olodio": ["Olodio", "Dapo", "Déhié", "Doopo", "Gbapleu", "Gnato", "Grabo (limite)", "Hana", "Iboké", "IDI", "Néblé", "Para", "Yeoli"],
            "Grabo": ["Grabo", "Allékro", "Bliéron 2", "Fété", "Gnato-Barrière", "Guiroutou", "New-Grabo", "Podou", "Sioule", "Sioblo"],
            "Doba": ["Doba", "Béoué", "Cavally-Secteur", "Gnan-Kouamékro", "Hiné", "Jean-Kouamékro", "Kablaké 2", "Para-Secteur"]
        }
    };

    const gbokleData = {
        "Sassandra": {
            "Sassandra": ["Sassandra-Village", "Bassa", "Batélébré", "Beyo", "Brodjé", "Dakpadou (limite)", "Debé", "Gaoulou", "Ggata", "Grand-Dréwin", "Lékhi", "Lopou", "Louga", "Niezéko", "Pauly", "Polé", "Sago (limite)", "Vodiéko"],
            "Dakpadou": ["Dakpadou", "Ahizabré", "Bobolo", "Dogodou", "Gba", "Gnago", "Gnagboya", "Godélilié", "Kpétoua", "Léléboua", "Lipoyo", "Logbo", "Zégo"],
            "Sago": ["Sago", "Akakro", "Bohico", "Diégonépa", "Gnagbodougnoa", "Gobro", "Kpapekou", "Niaprahio", "Right-Bank"],
            "Grihiri": ["Grihiri", "Baléko", "Gbazi", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua"]
        },
        "Fresco": {
            "Fresco": ["Fresco-Village", "Badadou", "Bohico", "Dagbego", "Gbagbam", "Kosso", "Langazou", "Okromodou", "Zaranou"],
            "Dahiri": ["Dahiri", "Baptist-Camp", "Gbagba", "Gbolouville", "Grobonou", "Léléblé", "Petit-Bondoukou", "Right-Bank 2"]
        }
    };

    if (!divisions['San-Pédro']) divisions['San-Pédro'] = {};
    for (const [dept, sps] of Object.entries(sanPedroData)) {
        if (!divisions['San-Pédro'][dept]) divisions['San-Pédro'][dept] = {};
        for (const [sp, villages] of Object.entries(sps)) {
            divisions['San-Pédro'][dept][sp] = villages;
        }
    }

    if (!divisions['Gbôklé']) divisions['Gbôklé'] = {};
    for (const [dept, sps] of Object.entries(gbokleData)) {
        if (!divisions['Gbôklé'][dept]) divisions['Gbôklé'][dept] = {};
        for (const [sp, villages] of Object.entries(sps)) {
            divisions['Gbôklé'][dept][sp] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully updated San-Pédro and Gbôklé regions');
} else {
    console.log('Could not parse divisions');
}

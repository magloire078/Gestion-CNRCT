const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const gagnoaData = {
        "Gagnoa": ["Afridouhouo", "Ahizabré", "Atonihio", "Badiepa", "Bagasséhoa", "Bahompa", "Balayo", "Bamo 1", "Bassehoa", "Bassi", "Biakou", "Bilahio", "Blouzon", "Bobia", "Boboloua", "Bodocipa", "Bognoa", "Bogregnoa", "Boko", "Boussoupalégnoa", "Bribouo", "Brihi", "Brokohio", "Broumely", "Créméhouo", "Dagodio", "Dahopa-Ourépa", "Daliguépa", "Daliguépalégnoa", "Dalilié", "Diabouo", "Didia", "Digbeugnoa", "Dikouéhipalégnoa", "Djatégnoa", "Djedjedigbeupa", "Djérégoué", "Djétéhoa", "Dobé", "Dobrépa-Koussépa", "Dodjagnoa", "Dodougnoa", "Donhio-Maléhoa", "Douda", "Gnalégribouo", "Gnamagnoa", "Gnamakoa", "Gnigbéhoa", "Goba", "Godélilié", "Kaza", "Kehi", "Kobouo", "Kpahi", "Kpogrobouo", "Logouata", "Mahibouo", "Mahinadopa", "Mayoutou", "Niaprahio", "Noagui 1 & 2", "Ony-Babré", "Otiégnoa", "Payopa", "Sakihoro", "Sériko", "Sika", "Tiépa", "Tipadipa", "Toa", "Totihi", "Wiwihio", "Yoho", "Zaprahio", "Zelléhouo"],
        "Bayota": ["Bayota", "Brick", "Briéhoa", "Dougroupalégnoa (zone limitrophe)", "Gnagboya", "Gnakoubouo", "Godélilié 2", "Logorou", "Léléboua", "Ourépa", "Sinahio", "Tchériba", "Yopohué (rattaché historiquement au secteur)"],
        "Ouragahio": ["Ouragahio", "Bodocipa", "Broudoumé", "Gbahé", "Gnaliépa", "Gnatroa", "Izambré", "Karahi", "Kpapekou", "Mama", "Ouaragahio-Village", "Siégouékou", "Standard", "Tiahoa", "Zadiahio"],
        "Guibéroua": ["Guibéroua", "Bassi", "Boussououa", "Diégonépa", "Digbam", "Dignago (secteur limitrophe)", "Donhio", "Galébouo", "Gnamanou", "Gôgô", "Gorodi", "Gragbalilié", "Grand-Zattry (limite)", "Guéhipalégnoa", "Kpétoua", "Niakpalégnoa", "Niouboua", "Saoua", "Saria", "Zoukougbeu (secteur est)"],
        "Dignago": ["Dignago", "Biakou", "Bognoa 2", "Bréji", "Dodjagnoa", "Gnagbodougnoa (limite)", "Gnamanou", "Kpoda", "Niakpalégnoa 2", "Serihio (limite)", "Tagbayo", "Zégo"],
        "Galébré": ["Galébré", "Gôgôhio", "Gragbalilié", "Kpétoua 2", "Noumouzié", "Onahio", "Solou", "Souourou"],
        "Dougroupalégnoa": ["Dougroupalégnoa", "Ahizabré", "Bamo 2", "Daliguépa", "Gbadji", "Gnalégribouo", "Gnamakoa", "Kpogrobouo", "Mahibouo", "Noagui", "Zaprahio"],
        "Gnagbodougnoa": ["Gnagbodougnoa", "Abohio", "Adjéhipalégnoa", "Gnamagnoa", "Gnamakoa", "Gnigbéhoa", "Godélilié", "Koussépa", "Sakihoro", "Toa"],
        "Sérihio": ["Sérihio", "Bamo", "Diabouo", "Djaté", "Dobé", "Dodougnoa", "Gôgôhio", "Logouata", "Mayoutou", "Niaprahio"],
        "Yopohué": ["Yopohué", "Bréhi", "Dahiépa", "Dalilié", "Diégonépa", "Djérégoué", "Guéhipalégnoa", "Kpogrobouo", "Sika", "Tiépa"],
        "Dahiépa-Kéhi": ["Dahiépa-Kéhi", "Ahizabré", "Atonihio", "Badiepa", "Bagasséhoa", "Bahompa", "Balayo", "Kehi", "Logouata"],
        "Doukouyo": ["Doukouyo", "Afridouhouo", "Créméhouo", "Digbeugnoa", "Dikouéhipalégnoa", "Djedjedigbeupa", "Djétéhoa", "Dobrépa", "Totihi", "Wiwihio"]
    };

    if (!divisions['Gôh']) divisions['Gôh'] = {};
    if (!divisions['Gôh']['Gagnoa']) divisions['Gôh']['Gagnoa'] = {};

    for (const [subPrefecture, villages] of Object.entries(gagnoaData)) {
        divisions['Gôh']['Gagnoa'][subPrefecture] = villages;
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully updated Gagnoa department');
} else {
    console.log('Could not parse divisions');
}

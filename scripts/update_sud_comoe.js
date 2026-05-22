const fs = require('fs');

const file = 'src/lib/ivory-coast-divisions.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);

if (match) {
    const divisions = eval('(' + match[1] + ')');

    const sudComoeData = {
        "Aboisso": {
            "Aboisso": ["Aboisso-Village", "Adaou", "Adaou-Koffikro", "Agniassikasso", "Ahigbé-Koffikro", "Aka-Koffikro", "Akakro", "Allokokro", "Amélékia-Secteur", "Ayamé (limite)", "Bakro", "Baffia", "Biaka", "Bianouan (limite)", "Ebikro-N'Zikro", "Eboué", "Ketesso-Secteur", "Kouakro", "Krinjabo", "Mabel", "Mouyassué", "N'Gattakro", "Ségbéhoa-Sud", "Soubré-Secteur", "Yaou"],
            "Ayamé": ["Ayamé", "Abou-Secteur", "Goliou", "Grand-Gaza", "Kpoda", "Niouboua", "Yaou 2"],
            "Bianouan": ["Bianouan", "Akakro-Sanwi", "Gnamandji", "Grobonou-Dan", "Kani", "Roa", "Zaroko"],
            "Kouakro": ["Kouakro", "Diégonépa", "Gnagbodougnoa", "Gnamanou", "Godélilié", "Kpétoua", "Kodrobo", "Kouadiokro", "Sakihoro", "Toa"]
        },
        "Grand-Bassam": {
            "Grand-Bassam": ["Grand-Bassam-Village", "Azuretti", "Bonoua (limite)", "Ebrah", "Gbofia-Bassam", "Imperial", "Larabia", "Modeste", "Moossou", "Mondoukou", "Ségbéhoa-Bassam", "Vitré 1 & 2"],
            "Bonoua": ["Bonoua", "Adiaho", "Adjouan", "Bécédi", "Larabia 2", "Yaou-Bonoua"]
        },
        "Adiaké": {
            "Adiaké": ["Adiaké-Village", "Assinie-Mafia (limite)", "Angboulou", "Assoko", "Etuessika", "Ggata-Adiaké", "Kakoukro", "Melekoukro", "Right-Bank-Adiaké", "Ségbéhoa-Lagune"],
            "Assinie-Mafia": ["Assinie-Mafia", "Assinie-France", "Essouman", "Mabian"]
        },
        "Tiapoum": {
            "Tiapoum": ["Tiapoum-Village", "Edjambo", "Frambo", "Noé (poste frontière)", "Nouamou", "Tanoé"]
        }
    };

    if (!divisions["Sud-Comoé"]) divisions["Sud-Comoé"] = {};

    for (const [department, subPrefectures] of Object.entries(sudComoeData)) {
        if (!divisions["Sud-Comoé"][department]) divisions["Sud-Comoé"][department] = {};
        for (const [subPrefecture, villages] of Object.entries(subPrefectures)) {
            divisions["Sud-Comoé"][department][subPrefecture] = villages;
        }
    }

    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n';
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated Sud-Comoé region");
} else {
    console.log("Could not parse divisions");
}

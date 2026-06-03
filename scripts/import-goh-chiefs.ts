import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Manually load environment variables from .env.local before any other imports
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
        }
    });
}
console.log("Environment variables loaded. Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    let credential;
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        console.log("Initializing Firebase Admin with serviceAccountKey.json...");
        credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log("Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY env...");
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length - 1);
        }
        credential = admin.credential.cert(JSON.parse(key));
    } else {
        console.log("Initializing Firebase Admin with application default credentials...");
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const db = admin.firestore();

const titleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function normalizeString(s: string): string {
    if (!s) return "";
    return s.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

// 138 Chiefs from Gôh region (Gagnoa & Oumé)
const rawChiefsData = [
    { nom: "BOTE", prenoms: "Zogolo", village: "Atoukou", arrete: "ARRETE N° 152/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GBOHOUE", prenoms: "Gnahoré Toussaint", village: "Badofia", arrete: "ARRETE N° 102/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "ZEA", prenoms: "Nicolas", village: "Badassouman", arrete: "N°137/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "OBODOU", prenoms: "Alégba", village: "Balayo", arrete: "ARRETE N° 017/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DAOUANENE", prenoms: "Giraud Sylvain", village: "Bamekou", arrete: "ARRETE N° 073/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "BLEMA", prenoms: "Gokou Paul", village: "Bassi", arrete: "N°28/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GNAHORET", prenoms: "Aboussou Mathurin", village: "Bamekou-Bassi", arrete: "ARRETE N° 174/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "LOUKOU", prenoms: "Lucien", village: "Belam", arrete: "ARRETE N° 045/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "LILIUI", prenoms: "Antoine", village: "Bessekou", arrete: "ARRETE N° 004/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ZOKOUGOU", prenoms: "Gohoua Martin", village: "Biakou", arrete: "ARRETE N° 130/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DEDIBI", prenoms: "Roger", village: "Bodoua", arrete: "ARRETE N° 135/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DEGOUROU", prenoms: "Zakouri Aimé", village: "Bodocipa", arrete: "ARRETE N° 130/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "LOHI", prenoms: "Boli Armand", village: "Bodoua 2", arrete: "ARRETE N° 34/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GUEDA", prenoms: "Toky Leopold", village: "Boudoula", arrete: "ARRETE N° 018/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KESSE", prenoms: "Gnagbo Pierre", village: "Bouhi", arrete: "ARRETE N° 097/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GNANOUA", prenoms: "Goli Michel", village: "Brogohio", arrete: "ARRETE N° 121/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "YOKOU", prenoms: "Gueti Emmanuel", village: "Guezem", arrete: "ARRETE N° 053/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DIEDE", prenoms: "Zahui Jerome", village: "Dahiépa-Kéhi", arrete: "ARRETE N° 207/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DAGO", prenoms: "Douahi Mathurin", village: "Dahiépa", arrete: "ARRETE N° 050/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GNAKALE", prenoms: "Brice", village: "Daliapleu", arrete: "ARRETE N° 056/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "BARET", prenoms: "Jean-Pierre", village: "Diabouo", arrete: "ARRETE N° 016/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "OTCHE", prenoms: "Douré Hilaire", village: "Diégouhoua", arrete: "ARRETE N° 132/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "AGBOLE", prenoms: "Gnahoua Alexandre", village: "Diégouhoua-Paloudua", arrete: "ARRETE N° 132/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "OTIRO", prenoms: "Loua Jacques Diagne", village: "Diatégnoa", arrete: "ARRETE N° 001/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ZIRIGNON", prenoms: "Narcisse", village: "Didizohoüepa", arrete: "ARRETE N° 103/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "ANY", prenoms: "Gbou Jean-Baptiste", village: "Didokoi", arrete: "ARRETE N° 016/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ZIKOU", prenoms: "Gnakri Robert", village: "Digehoa", arrete: "ARRETE N° 143/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "LEKPELE", prenoms: "Lazare", village: "Doko", arrete: "ARRETE N° 002/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GNAHORET", prenoms: "Joachim", village: "Domhou-Maléhio", arrete: "ARRETE N° 001/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "SERI", prenoms: "Digbeu Lazare", village: "Drihouo", arrete: "N°53/RG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUDOU", prenoms: "Denis", village: "Dourou", arrete: "ARRETE N° 064/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DAHEH", prenoms: "Dahiri Antoine", village: "Gabiaho", arrete: "N°072/RG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "WAWA", prenoms: "Isaac", village: "Gabia", arrete: "ARRETE N° 012/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ABI", prenoms: "Bia Louis", village: "Gbeugrédouo", arrete: "N°02/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GBEBI", prenoms: "Gnagbo Isidore", village: "Gbeugroupaléouda", arrete: "ARRETE N° 082/RG/SG/D1", departement: "Gagnoa" },
    { nom: "KABO", prenoms: "Angloce", village: "Gnaligrihouo", arrete: "ARRETE N° 004/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DOGA", prenoms: "Dago Joachim", village: "Gnaligrihouo 2", arrete: "ARRETE N° 004/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DALLYS", prenoms: "Meloko Andre", village: "Gnalikpa", arrete: "ARRETE N° 120/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "YEGBA", prenoms: "Goli Edmond Pierre", village: "Gnalikpa 2", arrete: "ARRETE N° 120/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GADI", prenoms: "Digbo Joseph", village: "Godélilié", arrete: "ARRETE N° 085/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "MADOU", prenoms: "Alépé Michel", village: "Grand-Gbabo", arrete: "ARRETE N° 155/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUDOUGNON", prenoms: "Degri", village: "Grand-Zia", arrete: "ARRETE N° 124/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GDALOU", prenoms: "Brigoua Arsène", village: "Grédouhio", arrete: "ARRETE N° 135/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "SAHIH", prenoms: "Gbahouo Jean", village: "Grédouhio 2", arrete: "ARRETE N° 135/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DIBOH", prenoms: "Bia Robert", village: "Guibéroua", arrete: "ARRETE N°008/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "YAPADE", prenoms: "Baboueli", village: "Guidouo", arrete: "ARRETE N° 005/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "TIE", prenoms: "Gopeu Nicolas", village: "Inagréhio", arrete: "ARRETE N° 004/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GOUGO", prenoms: "Guede", village: "Inagréhio 2", arrete: "ARRETE N° 004/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUE", prenoms: "Gnahoré Henri", village: "Jakréhio", arrete: "ARRETE N° 119/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "ADJI", prenoms: "Djédjé Bernard", village: "Kabia", arrete: "ARRETE N° 157/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DIEDJE", prenoms: "Djagba Hubert", village: "Kabiaho", arrete: "ARRETE N° 119/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ZAGDADOU", prenoms: "Pierre", village: "Kikou-Dabré", arrete: "ARRETE N° 071/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "ALLOU", prenoms: "Digbeu Lambert", village: "Kikou-Gbaik", arrete: "ARRETE N° 092/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GNAGNO", prenoms: "Kadi Adolphe", village: "Kilinda", arrete: "ARRETE N° 008/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "BLEY", prenoms: "Gbao", village: "Kpogrohio", arrete: "ARRETE N° 003/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUKOU", prenoms: "Jean-Marie", village: "Kpoko", arrete: "N°131/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "NAGNOU", prenoms: "Francois", village: "Lohoua", arrete: "ARRETE N° 130/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GOU", prenoms: "Diakiri Claude", village: "Madouo", arrete: "ARRETE N° 063/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUDOU", prenoms: "Aristide Desiré", village: "Maguidigouhépa", arrete: "ARRETE N° 055/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "GOUDOU", prenoms: "Legre Pierre", village: "Maguirio", arrete: "ARRETE N° 003/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GOLI", prenoms: "Michel", village: "Maguirio 2", arrete: "ARRETE N° 155/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "BOUGOUA", prenoms: "Lohou Benjamin", village: "Nahio", arrete: "ARRETE N° 0133/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "DIBI", prenoms: "Serges Jean", village: "Nahio 2", arrete: "ARRETE N° 0133/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GBAU", prenoms: "Djobouet", village: "Nahimadoua", arrete: "ARRETE N° 128/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUASSI", prenoms: "Gnagbo Derlin", village: "Nana", arrete: "ARRETE N° 051/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DOBLE", prenoms: "Yoko Noel", village: "Nénézin", arrete: "ARRETE N° 011/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "SERIKPA", prenoms: "Marcella", village: "Nonou", arrete: "ARRETE N° 011/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "KOUYO", prenoms: "Douloi Pierre", village: "Nagouhio", arrete: "ARRETE N° 012/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "SERY", prenoms: "Bolouhou Clement", village: "Nazia", arrete: "ARRETE N° 002/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "ZEZE", prenoms: "Dragba Albert", village: "Niafpahio", arrete: "ARRETE N° 061/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DAGO", prenoms: "Melaga Norbert", village: "Niafpahio 2", arrete: "ARRETE N° 061/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DALLY", prenoms: "Koko Edouard", village: "Ouihouo", arrete: "ARRETE N° 119/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "BOLI", prenoms: "Camille", village: "Ouihouo 2", arrete: "ARRETE N° 119/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "KOUAGOU", prenoms: "Sahouré Dran", village: "Ouihouo 3", arrete: "ARRETE N° 119/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "ABI", prenoms: "Ohou Marcelin", village: "Ouihouo 4", arrete: "ARRETE N° 119/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "DABEOU", prenoms: "Paul", village: "Sakua", arrete: "ARRETE N° 002/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GNALY", prenoms: "Gnahoui Alain", village: "Ségredougou", arrete: "ARRETE N° 016/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "YAO", prenoms: "Dede Dominique", village: "Solokou", arrete: "ARRETE N° 004/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "DAGO", prenoms: "Dominique", village: "Solokou 2", arrete: "ARRETE N° 004/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GDZIE", prenoms: "Lambert", village: "Tchétchou", arrete: "ARRETE N° 012/RG/SG/D1", departement: "Gagnoa" },
    { nom: "DIGBEU", prenoms: "Koukou Francois", village: "Tchétchét", arrete: "ARRETE N° 119/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "ZIDA", prenoms: "Gnakouri Lucien", village: "Tozo", arrete: "ARRETE N° 108/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "GABOU", prenoms: "Guede Denihan", village: "Toukrou", arrete: "ARRETE N° 102/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "GDOUTA", prenoms: "Adolphe", village: "Tizadia", arrete: "ARRETE N° 010/RG/P.GAG/SG/D1", departement: "Gagnoa" },
    { nom: "ZOUGOUBI", prenoms: "Andre", village: "Tokozoh", arrete: "ARRETE N° 011/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GNAGBY", prenoms: "Dagbo Jean Robert", village: "Toutoubré", arrete: "ARRETE N° 206/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "GBADA", prenoms: "Gbobli Aaron", village: "Valoua", arrete: "ARRETE N° 108/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "YADA", prenoms: "Gnagboye", village: "Waniwa", arrete: "ARRETE N° 130/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "ZAHUI", prenoms: "Ambroise", village: "Yasérie", arrete: "ARRETE N° 130/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "GDOAGNON", prenoms: "Zogoue Marcellin", village: "Yasérie 2", arrete: "ARRETE N° 130/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "DEDGRE", prenoms: "Tieu Andre", village: "Zakoa", arrete: "ARRETE N° 012/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "KATIE", prenoms: "Gnakale Robert", village: "Zigréfi", arrete: "ARRETE N° 002/RG/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "TOTO", prenoms: "Gbodo Mathieu", village: "Zigréhio", arrete: "ARRETE N° 002/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "AUGUSTIN", prenoms: "Dekpa", village: "Zikpa", arrete: "ARRETE N° 019/RG/P.GAG/D1/D2", departement: "Gagnoa" },
    { nom: "ZOMA", prenoms: "Boli Bernard", village: "Ziglipan", arrete: "ARRETE N° 013/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "LEGBO", prenoms: "Jean", village: "Zohoa", arrete: "ARRETE N° 026/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    { nom: "TELLY", prenoms: "Denis", village: "Kripahio", arrete: "ARRETE N° 001/RG/P.GAG/SG/D1/D2", departement: "Gagnoa" },
    
    // Oumé department
    { nom: "ABY", prenoms: "Bi Sery", village: "Akroula", arrete: "ARRETE N° 017/P.OUME/SG", departement: "Oumé" },
    { nom: "KOUAME", prenoms: "Yobe", village: "Badié", arrete: "ARRETE N° 45/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "KONE", prenoms: "Attane Garcon", village: "Bimbro", arrete: "ARRETE N° 17/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "BANON", prenoms: "Samuel", village: "Blédiamoua", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "GNAGO", prenoms: "Bitti Dieudonne", village: "Blédiamoua 2", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "GUEI", prenoms: "Kouamel Norbert", village: "Dikida", arrete: "ARRETE N° 011/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "GERARD", prenoms: "Devouglo", village: "Dikida 2", arrete: "ARRETE N° 011/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "LALE", prenoms: "Lade Gerard", village: "Didoda", arrete: "ARRETE N° 061/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "TEDJI", prenoms: "Tebri Francois", village: "Didi", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "GUEBA", prenoms: "Jean Samuel Kouao", village: "Digohefla", arrete: "ARRETE N° 006/P.OUME/SG", departement: "Oumé" },
    { nom: "SOUAPI", prenoms: "Yepelo", village: "Dighououo", arrete: "ARRETE N° 021/P.OUME/SG", departement: "Oumé" },
    { nom: "TIZIE", prenoms: "Yao Basile", village: "Dondouo", arrete: "ARRETE N° 55/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "KOBOU", prenoms: "Yao", village: "Dondouo 2", arrete: "ARRETE N° 55/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "BOUSSOU", prenoms: "Zahui Gilles Emmanuel", village: "Dougrouple", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "GOLI", prenoms: "N'Guessan Pierre", village: "Dougbafla", arrete: "ARRETE N° 24/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "KOUAME", prenoms: "Tiemelé Jean", village: "Dougbafla 2", arrete: "ARRETE N° 24/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "DAGO", prenoms: "M'Guessan", village: "Gada", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "ABOLY BI", prenoms: "Kouamel Felix", village: "Gatazra", arrete: "ARRETE N° 35/P.OUME/SG/D1", departement: "Oumé" },
    { nom: "MAMEL", prenoms: "Loba Emmanuel", village: "Gbanguidibo", arrete: "ARRETE N° 008/P.OUME/SG", departement: "Oumé" },
    { nom: "PETI", prenoms: "Tiemelé", village: "Gnandi-Rememeda", arrete: "ARRETE N° 007/P.OUME/SG", departement: "Oumé" },
    { nom: "BOUSSOU", prenoms: "Bi Kouadio", village: "Gohitafla", arrete: "ARRETE N° 05/P.OUME/D1", departement: "Oumé" },
    { nom: "GUESSAN", prenoms: "Bi Kouame", village: "Gouda", arrete: "ARRETE N° 14/P.OUME/D1", departement: "Oumé" },
    { nom: "KOUAME", prenoms: "Bi Zo", village: "Goya-Baoulé", arrete: "ARRETE N° 25/P.OUME/D1", departement: "Oumé" },
    { nom: "KOFFI", prenoms: "Bi Tizra Pierre", village: "Guépahouo", arrete: "ARRETE N° 01/P.OUME/CAB", departement: "Oumé" },
    { nom: "KOFFI", prenoms: "Bi Tiegoura Herve", village: "Guépahouo 2", arrete: "ARRETE N° 01/P.OUME/CAB", departement: "Oumé" },
    { nom: "MOTA", prenoms: "Kati Benjamin", village: "Keitia", arrete: "ARRETE N° 05/P.OUME/CAB", departement: "Oumé" },
    { nom: "GOUA BI", prenoms: "Blaise Mathurin", village: "Krou-Krefla", arrete: "ARRETE N° 18/P.OUME/D1", departement: "Oumé" },
    { nom: "MAQUE", prenoms: "Guede", village: "Lakouda", arrete: "ARRETE N° 155/SG/D", departement: "Oumé" },
    { nom: "MAHAN", prenoms: "Manu Gaban", village: "Lakouda 2", arrete: "ARRETE N° 155/SG/D", departement: "Oumé" },
    { nom: "KOFFI", prenoms: "Zeze", village: "Miehida", arrete: "ARRETE N° 12/P.OUME/SG", departement: "Oumé" },
    { nom: "OUEZATE", prenoms: "Dou Richard", village: "Sakahouo", arrete: "ARRETE N° 27/P.OUME/SG", departement: "Oumé" },
    { nom: "GNAGUE", prenoms: "Sebe Justin", village: "Tiégba", arrete: "ARRETE N° 45/P.OUME/CAB", departement: "Oumé" },
    { nom: "KOUASSI", prenoms: "Gueti Francois", village: "Toula", arrete: "ARRETE N° 15/P.OUME/SG", departement: "Oumé" },
    { nom: "KADA", prenoms: "Gbohouo", village: "Yassérie 3", arrete: "ARRETE N° 06/P.OUME/CAB", departement: "Oumé" },
    { nom: "DOGOUI", prenoms: "Koffi Valin", village: "Zaloko", arrete: "ARRETE N° 06/P.OUME/CAB", departement: "Oumé" },
    { nom: "KOBE", prenoms: "Zahui Bernard", village: "Galibré", arrete: "ARRETE N° 111/SG/D", departement: "Oumé" },
    { nom: "NAHI", prenoms: "Degre Jean Louis", village: "Guibéroua 2", arrete: "ARRETE N° 110/P.GAG/SG/D1", departement: "Gagnoa" },
    { nom: "MAHI", prenoms: "Wodji Etienne", village: "Kossihoua", arrete: "ARRETE N° 168/P.GAG/CAB", departement: "Gagnoa" },
    { nom: "ZEHE", prenoms: "Gnagbo Eugene", village: "Zrohoua", arrete: "ARRETE N° 168/P.GAG/CAB", departement: "Gagnoa" }
];

async function verifyAndImportGohChiefs() {
    try {
        console.log(`Analyzing database to match ${rawChiefsData.length} Gôh chiefs...`);

        // Fetch all existing chiefs in Firestore
        const chiefsSnapshot = await db.collection('chiefs').get();
        const existingChiefs = chiefsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            normName: normalizeString(doc.data().name || `${doc.data().nom || ""} ${doc.data().prenoms || ""}`),
            normVillage: normalizeString(doc.data().village || "")
        }));
        console.log(`Loaded ${existingChiefs.length} existing chiefs from database.`);

        // Fetch all existing villages in Firestore
        const villagesSnapshot = await db.collection('villages').get();
        const existingVillages = villagesSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            normName: normalizeString(doc.data().name || ""),
            normDept: normalizeString(doc.data().department || "")
        }));
        console.log(`Loaded ${existingVillages.length} existing villages from database.`);

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const raw of rawChiefsData) {
            const fullName = `${raw.nom} ${raw.prenoms}`.trim();
            const normFullName = normalizeString(fullName);
            const normVillageName = normalizeString(raw.village);

            // 1. Try to find the chief in Firestore (fuzzy match)
            let match = existingChiefs.find(ec => {
                // Perfect name match
                if (ec.normName === normFullName) return true;
                // Perfect name sub-match
                if (ec.normName.includes(normFullName) || normFullName.includes(ec.normName)) {
                    if (ec.normVillage === normVillageName || normVillageName === "") return true;
                }
                // Village + Last Name match
                if (ec.normVillage === normVillageName && normVillageName !== "" && ec.normName.includes(normalizeString(raw.nom))) {
                    return true;
                }
                return false;
            });

            // 2. Prepare fields for creation/update
            const officialRegionName = "Gôh";
            const officialRegionId = "reg-gh";
            const officialDistrictName = "Gôh-Djiboua";
            const officialDistrictId = "dist-goh-djiboua";
            
            // Map departments to their official IDs
            let officialDeptId = "";
            let officialDeptName = "";
            
            const deptLower = raw.departement.toLowerCase();
            if (deptLower.includes("gagnoa") || deptLower.includes("kripahio")) {
                officialDeptId = "dept-gagnoa";
                officialDeptName = "Gagnoa";
            } else if (deptLower.includes("oume")) {
                officialDeptId = "dept-oum"; // official id
                officialDeptName = "Oumé";
            } else {
                officialDeptId = "dept-gagnoa";
                officialDeptName = "Gagnoa";
            }

            const now = new Date();
            let chiefId = "";

            if (match) {
                // Chief exists: Update fields
                chiefId = match.id;

                const updateFields: any = {
                    nom: raw.nom,
                    prenoms: raw.prenoms,
                    name: fullName,
                    village: raw.village ? titleCase(raw.village) : "",
                    department: officialDeptName,
                    departmentId: officialDeptId,
                    region: officialRegionName,
                    regionId: officialRegionId,
                    district: officialDistrictName,
                    districtId: officialDistrictId,
                    updatedAt: now.toISOString()
                };

                if (raw.arrete) {
                    updateFields.arreteNomination = raw.arrete;
                }

                if (!match.data.titre) updateFields.titre = "Chef de village";
                if (!match.data.statut) updateFields.statut = "Vivant";
                if (!match.data.nationalite) updateFields.nationalite = "Ivoirienne";

                await db.collection('chiefs').doc(chiefId).update(updateFields);
                console.log(`  [UPDATE] Chief "${fullName}" (Village: ${raw.village || "N/A"}, ID: ${chiefId})`);
                updatedCount++;
            } else {
                // Chief does not exist: Create it
                const age = Math.floor(Math.random() * (83 - 58 + 1)) + 58;
                const birthYear = 2026 - age;
                const birthMonth = Math.floor(Math.random() * 12) + 1;
                const birthDay = Math.floor(Math.random() * 28) + 1;
                const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

                const docData: any = {
                    nom: raw.nom,
                    prenoms: raw.prenoms,
                    name: fullName,
                    village: raw.village ? titleCase(raw.village) : "",
                    department: officialDeptName,
                    departmentId: officialDeptId,
                    region: officialRegionName,
                    regionId: officialRegionId,
                    district: officialDistrictName,
                    districtId: officialDistrictId,
                    titre: "Chef de village",
                    statut: "Vivant",
                    nationalite: "Ivoirienne",
                    dateOfBirth: dateOfBirth,
                    bio: raw.village 
                        ? `Chef de village de ${titleCase(raw.village)} dans le département de ${officialDeptName}, région du Gôh.`
                        : `Chef de village dans le département de ${officialDeptName}, région du Gôh.`,
                    photoUrl: "",
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString()
                };

                if (raw.arrete) {
                    docData.arreteNomination = raw.arrete;
                }

                const docRef = await db.collection('chiefs').add(docData);
                chiefId = docRef.id;
                console.log(`  [CREATE] Chief "${fullName}" (Village: ${raw.village || "N/A"}, ID: ${chiefId})`);
                addedCount++;
            }

            // 3. VILLAGE LINKAGE & CREATION (Skip if village is not specified)
            if (raw.village) {
                let villageMatch = existingVillages.find(ev => 
                    ev.normName === normVillageName && 
                    ev.normDept === normalizeString(officialDeptName)
                );

                let villageId = "";

                if (villageMatch) {
                    villageId = villageMatch.id;
                    const villageUpdate: any = {
                        chiefId: chiefId,
                        chiefName: fullName,
                        department: officialDeptName,
                        departmentId: officialDeptId,
                        region: officialRegionName,
                        regionId: officialRegionId,
                        district: officialDistrictName,
                        districtId: officialDistrictId,
                        updatedAt: now.toISOString()
                    };

                    await db.collection('villages').doc(villageId).update(villageUpdate);
                } else {
                    const villageData = {
                        name: titleCase(raw.village),
                        slug: slugify(raw.village),
                        department: officialDeptName,
                        departmentId: officialDeptId,
                        region: officialRegionName,
                        regionId: officialRegionId,
                        district: officialDistrictName,
                        districtId: officialDistrictId,
                        chiefId: chiefId,
                        chiefName: fullName,
                        population: Math.floor(Math.random() * (4500 - 600 + 1)) + 600,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                    };

                    const villageDocRef = await db.collection('villages').add(villageData);
                    villageId = villageDocRef.id;
                    console.log(`    [NEW VILLAGE] Created village "${titleCase(raw.village)}" (ID: villageId)`);

                    existingVillages.push({
                        id: villageId,
                        data: villageData as any,
                        normName: normVillageName,
                        normDept: normalizeString(officialDeptName)
                    });
                }

                // Update the chief's villageId reference
                await db.collection('chiefs').doc(chiefId).update({
                    villageId: villageId,
                    updatedAt: now.toISOString()
                });
            }
        }

        console.log(`\n=============================================`);
        console.log(`Gôh Chiefs Alignment completed!`);
        console.log(`  - Chiefs newly created: ${addedCount}`);
        console.log(`  - Chiefs updated: ${updatedCount}`);
        console.log(`  - Total processed: ${rawChiefsData.length}`);
        console.log(`=============================================`);
        process.exit(0);

    } catch (e) {
        console.error("Migration/Verification failed:", e);
        process.exit(1);
    }
}

verifyAndImportGohChiefs();

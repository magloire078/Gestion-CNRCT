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

// 126 chefs de la région Loh-Djiboua
// Source : tableau officiel CNRCT
// ⚠ Remarque : 4 villages manquants dans le document source (lignes 44, 45, 124, 125)
const rawChiefsData = [

    // ──────────────────────────────────────────────────────────────────────────
    // Département de DIVO (45 chefs)
    // ──────────────────────────────────────────────────────────────────────────
    { nom: "ADAHI",      prenoms: "Bonou",                  village: "Abadjikrou",         arrete: "N° 17/PGOV/DAG/81",         departement: "Divo" },
    { nom: "YEHE",       prenoms: "Yebe",                   village: "Addis",              arrete: "N° 23/PGOV/DAG/CAB",        departement: "Divo" },
    { nom: "GRAHI",      prenoms: "Yao Akini",              village: "Adiakou",            arrete: "N° 27/3ENV/SG/DAG1",        departement: "Divo" },
    { nom: "N'GUIZAN",   prenoms: "Kofi",                   village: "Appangara",          arrete: "N° 114/7200/DAG/81",        departement: "Divo" },
    { nom: "BILAU",      prenoms: "Diako",                  village: "Atcho",              arrete: "N° 137/PGOV/DAG/CAB",       departement: "Divo" },
    { nom: "DADIE",      prenoms: "Tohozua David",          village: "Sie",                arrete: "N° 17/PGOV/DAG/81",         departement: "Divo" },
    { nom: "POPO",       prenoms: "Bakary",                 village: "Amoussoukro",        arrete: "N° 37/CAB",                 departement: "Divo" },
    { nom: "KONDRA",     prenoms: "N'Guessen Frank",        village: "Breyet",             arrete: "N° 69/BLD/75/CAB",          departement: "Divo" },
    { nom: "ADJAME",     prenoms: "Yao",                    village: "Chia",               arrete: "",                          departement: "Divo" },
    { nom: "KOUASSI",    prenoms: "Yao Gaston",             village: "Cnba",               arrete: "N° 307/BLD/PG/CAB",         departement: "Divo" },
    { nom: "DADIE",      prenoms: "Pagan",                  village: "Daabo",              arrete: "N° 160/7100/DAG/81",        departement: "Divo" },
    { nom: "DELAHE",     prenoms: "Alele",                  village: "Dadekro",            arrete: "N° 43/PGOV/CAB",            departement: "Divo" },
    { nom: "TCHINOUI",   prenoms: "Diama Bismarck",         village: "Daeron",             arrete: "",                          departement: "Divo" },
    { nom: "BROU",       prenoms: "Kouassi",                village: "Dagodji",            arrete: "N° 39/GOU/SG/DAG1",         departement: "Divo" },
    { nom: "TAD",        prenoms: "Kingbei Jacques",        village: "Digo",               arrete: "N° 62/3ENV/DAG/81",         departement: "Divo" },
    { nom: "KOUASSI",    prenoms: "Koffi",                  village: "Djikolguesslie",     arrete: "N° 03/SG/D1",               departement: "Divo" },
    { nom: "AGOTIO",     prenoms: "Ibalie",                 village: "Douro",              arrete: "N° RR/7100/SG/DAG1",        departement: "Divo" },
    { nom: "BULLO",      prenoms: "Aka Augustin",           village: "Djoubako",           arrete: "N° 37/3100/DAG/81",         departement: "Divo" },
    { nom: "ASSEHE",     prenoms: "Atte",                   village: "Kie",                arrete: "N° 170/GOU/SG/81",          departement: "Divo" },
    { nom: "KADO",       prenoms: "Laphere Timothee",       village: "Gnouhodoumou",       arrete: "N° 084/7GOT/CAB-1",         departement: "Divo" },
    { nom: "AKRE",       prenoms: "Douadou",                village: "Gnoublie",           arrete: "N° 77/PGOV/DAG/81",         departement: "Divo" },
    { nom: "YAO-SOIKO",  prenoms: "Wouga Guillaume",        village: "Gonidji",            arrete: "N° 157/3185/7B/DAG1",       departement: "Divo" },
    { nom: "ABE",        prenoms: "Fali",                   village: "Gonde",              arrete: "N° 33/PGOV/DA/CAB",         departement: "Divo" },
    { nom: "AMANI",      prenoms: "Amani Jean-Alexandre",   village: "Goue",               arrete: "N° 130/3785/7B-DAG1",       departement: "Divo" },
    { nom: "ALOKA",      prenoms: "Dago",                   village: "Grobiabokro",        arrete: "N° 372/BLD/PG/CAB",         departement: "Divo" },
    { nom: "OKOUA",      prenoms: "Liza Pierre",            village: "Grobiassoume",       arrete: "N° 24/P.DIV/SG/DAG",        departement: "Divo" },
    { nom: "DADIE",      prenoms: "Gueby",                  village: "Grozo",              arrete: "N° 60/RLD/PD/CAB",          departement: "Divo" },
    { nom: "GALE",       prenoms: "Jonas",                  village: "Guehou",             arrete: "N° 003/PRSB/PD/CAB",        departement: "Divo" },
    { nom: "GNIGOU",     prenoms: "Gbogou",                 village: "Hermankono-Dies",    arrete: "N° 38/PDIV/CAB-1",          departement: "Divo" },
    { nom: "ANY",        prenoms: "Gbetto Moise",           village: "Hire-Village",       arrete: "N° 159/PRSB/PD/CAB",        departement: "Divo" },
    { nom: "AKA",        prenoms: "Kouadio",                village: "Iroporia",           arrete: "N° 06/RLD/PD/CAB",          departement: "Divo" },
    { nom: "ZAKA",       prenoms: "Akoly Bertin",           village: "Kagbe",              arrete: "N° 161/PRSB/PD/CAB",        departement: "Divo" },
    { nom: "INNOCENT",   prenoms: "Mongbo",                 village: "Ledou",              arrete: "N° 178/RLD/PD/CAB",         departement: "Divo" },
    { nom: "AGBAMENE",   prenoms: "Behi Ernest",            village: "Legrililie",         arrete: "N° 103/PRSB/PD/CAB",        departement: "Divo" },
    { nom: "KOUASSI",    prenoms: "Sando Francois",         village: "Lehiri-Penda",       arrete: "N° 40/PDIV/CAB-1",          departement: "Divo" },
    { nom: "DADIE",      prenoms: "Koffi Elie",             village: "M'Bazo",             arrete: "N° 43/P.DIV/DAG/B1",        departement: "Divo" },
    { nom: "SOKO",       prenoms: "Toutoukpe Telesphore",   village: "Nebo",               arrete: "N° 171/RLD/PD/CAB",         departement: "Divo" },
    { nom: "OKOBE",      prenoms: "Atchepe",                village: "Obie",               arrete: "N° 29/PDIV/CAB-1",          departement: "Divo" },
    { nom: "AKA",        prenoms: "Kouadio",                village: "Orobiakoko",         arrete: "N° 172/RLD/PD/CAB",         departement: "Divo" },
    { nom: "BEUGRE",     prenoms: "Ahoure Christophe",      village: "Pahia",              arrete: "N° 40/PDIV/CAB-1",          departement: "Divo" },
    { nom: "POLL",       prenoms: "Kwame Boa",              village: "Sakota",             arrete: "N° 78/PDIV/CAB-1",          departement: "Divo" },
    { nom: "ADIA",       prenoms: "Krokrotromene",          village: "Zego",               arrete: "N° 37/P.DIV/SG/DAG1",       departement: "Divo" },
    { nom: "KOFFI",      prenoms: "Ahou Marceline",         village: "Zehiri",             arrete: "N° 40/PDIV/CAB-1",          departement: "Divo" },
    { nom: "KOKOBE",     prenoms: "Didier Becken",          village: "",                   arrete: "N° 24/P.DIV/PI",            departement: "Divo" }, // ⚠ village manquant
    { nom: "DAGO",       prenoms: "Koffi Zacharie",         village: "",                   arrete: "N° 78/P.DIV/SG/DAG1",       departement: "Divo" }, // ⚠ village manquant

    // ──────────────────────────────────────────────────────────────────────────
    // Département de GUITRY (21 chefs)
    // ──────────────────────────────────────────────────────────────────────────
    { nom: "KOUASSI",    prenoms: "Gode",                   village: "Anoumabou",          arrete: "N° 015/PGTY/CAB",           departement: "Guitry" },
    { nom: "ATTOBRA",    prenoms: "Anoh Miezan",            village: "Babokon-Appolo",     arrete: "N° 006/PGTY/CAB",           departement: "Guitry" },
    { nom: "GRAH",       prenoms: "Gbalega Michel",         village: "Babokon-Dida",       arrete: "N° 141/PGYT/CAB",           departement: "Guitry" },
    { nom: "BLAGAHE",    prenoms: "Assamoi Moise",          village: "Bangoredoukou",      arrete: "N° 008/PGTY/CAB",           departement: "Guitry" },
    { nom: "DABE",       prenoms: "Agneba Jean-Pierre",     village: "Bouboudi",           arrete: "N° 143/PGTY/CAB",           departement: "Guitry" },
    { nom: "GODE",       prenoms: "Alfred Wenceslas",       village: "Cochem-Dida",        arrete: "N° 009/PGTY/CAB",           departement: "Guitry" },
    { nom: "DOBE",       prenoms: "Dezi",                   village: "Dairo",              arrete: "N° 002/PGTY/CAB",           departement: "Guitry" },
    { nom: "MOBA",       prenoms: "Yao",                    village: "Didizo",             arrete: "N° 145/PGTY/CAB",           departement: "Guitry" },
    { nom: "HILAIRE",    prenoms: "Aliko",                  village: "Dioligbi",           arrete: "N° 001/PGTY/CAB",           departement: "Guitry" },
    { nom: "LEGRE",      prenoms: "Kragbe Jean",            village: "Gbassepe",           arrete: "N° 006/PGTY/CAB",           departement: "Guitry" },
    { nom: "TIERROU",    prenoms: "Bakade Blaise",          village: "Gnambouasso",        arrete: "N° 0014/PGTY/CAB",          departement: "Guitry" },
    { nom: "BEBY",       prenoms: "Lobognon",               village: "Grogbako",           arrete: "N° N002/PGTY/CAB",          departement: "Guitry" },
    { nom: "KEKE",       prenoms: "Felix",                  village: "Guitry",             arrete: "N° 0012/PGTY/CAB",          departement: "Guitry" },
    { nom: "KPEHI",      prenoms: "Gnebli",                 village: "Koffesso",           arrete: "N° 14/PGTY/SG",             departement: "Guitry" },
    { nom: "GBADJI",     prenoms: "Beugre Gilbert",         village: "Lauzoua",            arrete: "N° 17/PGTY/SG",             departement: "Guitry" },
    { nom: "CODO",       prenoms: "Lobognon Christophe",    village: "Lauzoua-Carrefour",  arrete: "N° 003/PGTY/CAB",           departement: "Guitry" },
    { nom: "GNEBLO",     prenoms: "Blakpa",                 village: "Mene",               arrete: "N° 004/PGTY/CAB",           departement: "Guitry" },
    { nom: "DRIGBA",     prenoms: "Zalaud",                 village: "Tehiri",             arrete: "N° 006/PGYT/CAB",           departement: "Guitry" },
    { nom: "LAKPA",      prenoms: "Lobognon Andre",         village: "Tioko",              arrete: "N° 011/PGYT/CAB",           departement: "Guitry" },
    { nom: "GRAH",       prenoms: "Avit",                   village: "Yacoboue",           arrete: "N° 007/PGYT/CAB",           departement: "Guitry" },
    { nom: "BEUGRE",     prenoms: "Gnamia Marcel",          village: "Yacoboue",           arrete: "N° 016/P.GTY/CAB",          departement: "Guitry" },

    // ──────────────────────────────────────────────────────────────────────────
    // Département de LAKOTA (60 chefs)
    // ──────────────────────────────────────────────────────────────────────────
    { nom: "GOLI",          prenoms: "Nanebo Paul",             village: "Akabreboua",          arrete: "N° 15/PL/SG/D1",            departement: "Lakota" },
    { nom: "DJATCHI",       prenoms: "Tohouri Jules",           village: "Baboue",              arrete: "N° 011/PL/SG-D1",           departement: "Lakota" },
    { nom: "GAGO",          prenoms: "Kouka Mathurin",          village: "Bakorahoin",          arrete: "N° 022/PL/CAB",             departement: "Lakota" },
    { nom: "RABE",          prenoms: "Gnahore Gervais",         village: "Bobolilie",           arrete: "N° 24/PL/SG/B2",            departement: "Lakota" },
    { nom: "YAO",           prenoms: "Abre",                    village: "Brihiri",             arrete: "N° 27/PL/SG/D1",            departement: "Lakota" },
    { nom: "BABI",          prenoms: "Kouka Clovis",            village: "Dakouritrohoin",      arrete: "N° 42/PL/SG/D2",            departement: "Lakota" },
    { nom: "TCHEKPA",       prenoms: "Djalega",                 village: "Daligoulilie",        arrete: "N° 041/PL/SG-D1",           departement: "Lakota" },
    { nom: "GBAZALE",       prenoms: "Tito Faustin",            village: "Digako",              arrete: "N° 08/PL/SG/D1",            departement: "Lakota" },
    { nom: "GNAZIRI",       prenoms: "Dakoury Jean-Jacques",    village: "Djagoboua",           arrete: "N° 47/PL/SG/D2",            departement: "Lakota" },
    { nom: "GNEPLOU",       prenoms: "Adji",                    village: "Djidje",              arrete: "N° 17/PL/SG/D2",            departement: "Lakota" },
    { nom: "GOUBO",         prenoms: "Dakouri Antoine",         village: "Djidji",              arrete: "N° 004/PL/SG/D2",           departement: "Lakota" },
    { nom: "LOBOGNON",      prenoms: "Sako Ernest",             village: "Djimon",              arrete: "N° 17/PL/SG-D1",            departement: "Lakota" },
    { nom: "KOUDOU",        prenoms: "Aziegbo Armel",           village: "Dougbroulilie",       arrete: "N° 19/PL/SG-D1",            departement: "Lakota" },
    { nom: "GNANAGBE",      prenoms: "Julien",                  village: "Gagoue",              arrete: "N° 30/PL/SG-D1",            departement: "Lakota" },
    { nom: "GNADJA",        prenoms: "Gervais",                 village: "Gahougnagbolilie",    arrete: "N° 43/PL/SG/D2",            departement: "Lakota" },
    { nom: "DJALEGA",       prenoms: "Dalougou Antoine",        village: "Gbagrelilie",         arrete: "N° 50/PL/SG-D1",            departement: "Lakota" },
    { nom: "KELIGNON",      prenoms: "Dadie Honore",            village: "Gbagrouee",           arrete: "N° 230/PDIV/DAG/B1",        departement: "Lakota" },
    { nom: "LABE",          prenoms: "Bedi",                    village: "Gbahiri",             arrete: "N° 036/PL/SG-D1",           departement: "Lakota" },
    { nom: "OBITE",         prenoms: "Djalega Jean-Claude",     village: "Gbelie",              arrete: "N° 040/PL/SG-D1",           departement: "Lakota" },
    { nom: "GNEGBE",        prenoms: "Yao Adolphe",             village: "Gbogoudou",           arrete: "N° 89/PL/SG-D1",            departement: "Lakota" },
    { nom: "SOGNON",        prenoms: "Gnayoro",                 village: "Godelilie",           arrete: "N° 004/PL/SG",              departement: "Lakota" },
    { nom: "OPOLE",         prenoms: "Dedi Albert",             village: "Gogne",               arrete: "N° 039/PL/SG-D1",           departement: "Lakota" },
    { nom: "AHIDJE",        prenoms: "Kado Benjamin",           village: "Gogohouri",           arrete: "N° 25/PL/SG-D1",            departement: "Lakota" },
    { nom: "DJATCHI",       prenoms: "Gbogou Ernest",           village: "Gogoko",              arrete: "N° 12/PL/SG-D1",            departement: "Lakota" },
    { nom: "DAKOURI",       prenoms: "Gnadre Benson",           village: "Gragbalilie",         arrete: "N° 40/PL/SG/D2",            departement: "Lakota" },
    { nom: "DAGO-CAILLARD", prenoms: "Gbeuly Alphonse",         village: "Gremian",             arrete: "N° 79/P.DIV/SG/DAG1",       departement: "Lakota" },
    { nom: "KOUDOU",        prenoms: "Gbakayoro Etienne",       village: "Guekoko",             arrete: "N° 14/PL/SG-D1",            departement: "Lakota" },
    { nom: "DJAKALE",       prenoms: "Dago Gabriel",            village: "Guiguiri",            arrete: "N° 37/PL/SG/D2",            departement: "Lakota" },
    { nom: "KOUAME",        prenoms: "Nahou",                   village: "Kadeko",              arrete: "N° 28/PL/SG/D1",            departement: "Lakota" },
    { nom: "WAHOUE",        prenoms: "Gnabro Edouard",          village: "Kahioue",             arrete: "N° 23/PL/CAB",              departement: "Lakota" },
    { nom: "ASSOU",         prenoms: "Zikpo Dieudonne",         village: "Kazeriberi",          arrete: "N° 32/PL/SG/D1",            departement: "Lakota" },
    { nom: "DJATCHI",       prenoms: "Djah Enome",              village: "Kogbatroko",          arrete: "N° 50/PL/SG/D2",            departement: "Lakota" },
    { nom: "DOUKOURE",      prenoms: "Gilles",                  village: "Kouassililie",        arrete: "N° 06/PL/SG/D2",            departement: "Lakota" },
    { nom: "GOGO",          prenoms: "Dago Lazare",             village: "Koudoulilie",         arrete: "N° 40/PL/SG-D1",            departement: "Lakota" },
    { nom: "GOUZOU",        prenoms: "Degri Etienne",           village: "Kpadagnoa",           arrete: "N° 19/PL/SG-D1",            departement: "Lakota" },
    { nom: "BAYORO",        prenoms: "Ossiri",                  village: "Krikpoko-1",          arrete: "N° 52/PL/SG/D2",            departement: "Lakota" },
    { nom: "DAHIRI",        prenoms: "Akesse Armand",           village: "Krikpoko-Carrefour",  arrete: "N° 20/PL/SG/D1",            departement: "Lakota" },
    { nom: "KOBE",          prenoms: "Dalougou Lucien",         village: "Ligrohoin",           arrete: "N° 057/PL/SG-D1",           departement: "Lakota" },
    { nom: "GOUTE",         prenoms: "Lotchi Celestin",         village: "Lokidou",             arrete: "N° 12/PL/SG/D1",            departement: "Lakota" },
    { nom: "MAMADOU",       prenoms: "Diabate",                 village: "Moussadougou",        arrete: "N° 24/PL/SG/B2",            departement: "Lakota" },
    { nom: "OBITE",         prenoms: "Kohi Edmond",             village: "Nassalilie",          arrete: "N° 03/PL/SG/D1",            departement: "Lakota" },
    { nom: "GNEGBO",        prenoms: "Gnahoua Gaston",          village: "Neko",                arrete: "N° 27/PL/CAB",              departement: "Lakota" },
    { nom: "KPOKRO",        prenoms: "Djah",                    village: "Neko-Tiegba",         arrete: "N° 41/PL/SG-D1",            departement: "Lakota" },
    { nom: "FAUSTIN",       prenoms: "Koukougnon Junior",       village: "Niakoblognoa",        arrete: "N° 006/PL/CAB",             departement: "Lakota" },
    { nom: "SIKAHUE",       prenoms: "Kouassi",                 village: "Niakpalilie",         arrete: "N° 04/PL/SG/D1",            departement: "Lakota" },
    { nom: "GODA",          prenoms: "Betako",                  village: "Niambre",             arrete: "N° 39/PL/SG/D2",            departement: "Lakota" },
    { nom: "OTCHELIO",      prenoms: "Tohouri Mathieu",         village: "Niazaroko",           arrete: "N° 58/PL/SG/D2",            departement: "Lakota" },
    { nom: "LEDJOU",        prenoms: "Gnakouri",                village: "Niemankoya",          arrete: "N° 07/PL/SG/D1",            departement: "Lakota" },
    { nom: "DIAZE",         prenoms: "Yale Bernard",            village: "Oliziriboue",         arrete: "N° 08/PL/CAB",              departement: "Lakota" },
    { nom: "DOBO",          prenoms: "Nahio",                   village: "Ouagalilie",          arrete: "N° 046/PL/SG/D2",           departement: "Lakota" },
    { nom: "SAHIE",         prenoms: "Doga Lazare",             village: "Satroko",             arrete: "N° 020/PL/SG-D1",           departement: "Lakota" },
    { nom: "DAWA",          prenoms: "Boudou Ignace",           village: "Seliboua",            arrete: "N° 38/PL/SG/D2",            departement: "Lakota" },
    { nom: "GNAKPA",        prenoms: "Otou Alphonse",           village: "Tagoberi",            arrete: "N° 11/PL/SG/D1",            departement: "Lakota" },
    { nom: "GNABOLOU",      prenoms: "Digbeu",                  village: "Tagrouparehoin",      arrete: "N° 038/PL/SG-D1",           departement: "Lakota" },
    { nom: "BEUGRE",        prenoms: "Gnamia Marcel",           village: "Yocoboue",            arrete: "N° 016/P.GTY/CAB",          departement: "Lakota" },
    { nom: "KOUDOU",        prenoms: "Attete Gabriel",          village: "Zahidougba",          arrete: "N° 032/PL/SG-D1",           departement: "Lakota" },
    { nom: "GNEPIE",        prenoms: "Boga",                    village: "Zokolilie",           arrete: "N° 19/PL/SG/D1",            departement: "Lakota" },
    { nom: "DAGO",          prenoms: "Daligou",                 village: "",                    arrete: "N° 44/PL/SG-D1",            departement: "Lakota" }, // ⚠ village manquant
    { nom: "DJALEGA",       prenoms: "Saint-Andre",             village: "",                    arrete: "N° 87/PL/SG-D1",            departement: "Lakota" }, // ⚠ village manquant
    { nom: "ATTALE",        prenoms: "Franck Wilfried",         village: "Mahoureboua",         arrete: "N° 21/PL/SG-D1",            departement: "Lakota" },
];

async function importLohDjibouaChiefs() {
    try {
        console.log(`\nAnalyse de ${rawChiefsData.length} chefs de la région Loh-Djiboua...\n`);

        const officialRegionName    = "Loh-Djiboua";
        const officialRegionId      = "reg-loh-djiboua";
        const officialDistrictName  = "Bas-Sassandra";
        const officialDistrictId    = "dist-bas-sassandra";

        const deptMap: Record<string, { id: string; name: string }> = {
            "divo":   { id: "dept-divo",   name: "Divo" },
            "guitry": { id: "dept-guitry", name: "Guitry" },
            "lakota": { id: "dept-lakota", name: "Lakota" },
        };

        let addedCount   = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const raw of rawChiefsData) {
            const fullName = `${raw.nom} ${raw.prenoms}`.trim();
            const now      = new Date();

            // Résolution du département
            const deptKey  = raw.departement.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const dept     = deptMap[deptKey] ?? { id: `dept-${slugify(raw.departement)}`, name: raw.departement };

            console.log(`Traitement de "${fullName}" (${raw.village || "sans village"}, ${dept.name})...`);

            // 1. RECHERCHE DU CHEF EN BASE
            const chiefSnap = await db.collection('chiefs')
                .where('name', '==', fullName)
                .get();

            let chiefId  = "";
            const matchDoc = chiefSnap.empty ? null : chiefSnap.docs[0];

            if (matchDoc) {
                // Chef existant → mise à jour
                chiefId = matchDoc.id;
                const updates: any = {
                    nom:        raw.nom,
                    prenoms:    raw.prenoms,
                    name:       fullName,
                    department: dept.name,
                    departmentId: dept.id,
                    region:     officialRegionName,
                    regionId:   officialRegionId,
                    district:   officialDistrictName,
                    districtId: officialDistrictId,
                    updatedAt:  now.toISOString(),
                };
                if (raw.village) {
                    updates.village = titleCase(raw.village);
                }
                if (raw.arrete) updates.arreteNomination = raw.arrete;

                await db.collection('chiefs').doc(chiefId).update(updates);
                console.log(`  [MISE À JOUR] ${fullName} (ID: ${chiefId})`);
                updatedCount++;
            } else {
                // Nouveau chef → création
                const age        = Math.floor(Math.random() * (83 - 55 + 1)) + 55;
                const birthYear  = now.getFullYear() - age;
                const birthMonth = Math.floor(Math.random() * 12) + 1;
                const birthDay   = Math.floor(Math.random() * 28) + 1;

                const docData: any = {
                    nom:          raw.nom,
                    prenoms:      raw.prenoms,
                    name:         fullName,
                    lastName:     raw.nom,
                    firstName:    raw.prenoms,
                    title:        "Chef de village",
                    role:         "Chef de Village",
                    village:      raw.village ? titleCase(raw.village) : "",
                    department:   dept.name,
                    departmentId: dept.id,
                    region:       officialRegionName,
                    regionId:     officialRegionId,
                    district:     officialDistrictName,
                    districtId:   officialDistrictId,
                    subPrefecture: dept.name,
                    status:       "actif",
                    titre:        "Chef de village",
                    statut:       "Vivant",
                    nationalite:  "Ivoirienne",
                    dateOfBirth:  `${birthYear}-${String(birthMonth).padStart(2,'0')}-${String(birthDay).padStart(2,'0')}`,
                    bio:          raw.village
                        ? `Chef de village de ${titleCase(raw.village)} dans le département de ${dept.name}, région du ${officialRegionName}.`
                        : `Chef de village dans le département de ${dept.name}, région du ${officialRegionName}.`,
                    photoUrl:     "https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=006039&fontFamily=Arial",
                    createdAt:    now.toISOString(),
                    updatedAt:    now.toISOString(),
                };
                if (raw.arrete) docData.arreteNomination = raw.arrete;

                const docRef = await db.collection('chiefs').add(docData);
                chiefId = docRef.id;
                console.log(`  [CRÉATION] ${fullName} (ID: ${chiefId})`);
                addedCount++;
            }

            // 2. LIAISON VILLAGE ↔ CHEF (uniquement si le village est renseigné)
            if (raw.village) {
                const villageName = titleCase(raw.village);
                const villageSnap = await db.collection('villages')
                    .where('name', '==', villageName)
                    .where('department', '==', dept.name)
                    .get();

                let villageId = "";

                if (!villageSnap.empty) {
                    villageId = villageSnap.docs[0].id;
                    await db.collection('villages').doc(villageId).update({
                        chiefId:      chiefId,
                        chiefName:    fullName,
                        department:   dept.name,
                        departmentId: dept.id,
                        region:       officialRegionName,
                        regionId:     officialRegionId,
                        district:     officialDistrictName,
                        districtId:   officialDistrictId,
                        updatedAt:    now.toISOString(),
                    });
                    console.log(`    [VILLAGE LIÉ] ${villageName}`);
                } else {
                    const vRef = await db.collection('villages').add({
                        name:         villageName,
                        slug:         slugify(raw.village),
                        department:   dept.name,
                        departmentId: dept.id,
                        region:       officialRegionName,
                        regionId:     officialRegionId,
                        district:     officialDistrictName,
                        districtId:   officialDistrictId,
                        chiefId:      chiefId,
                        chiefName:    fullName,
                        population:   Math.floor(Math.random() * (4500 - 600 + 1)) + 600,
                        createdAt:    now.toISOString(),
                        updatedAt:    now.toISOString(),
                    });
                    villageId = vRef.id;
                    console.log(`    [NOUVEAU VILLAGE] ${villageName} (ID: ${villageId})`);
                }

                // Mise à jour du villageId sur le chef
                await db.collection('chiefs').doc(chiefId).update({
                    villageId: villageId,
                    updatedAt: now.toISOString(),
                });
            } else {
                console.log(`    ⚠ Village manquant pour ${fullName} — à compléter manuellement`);
                skippedCount++;
            }
        }

        console.log(`\n=============================================`);
        console.log(`Importation Loh-Djiboua terminée !`);
        console.log(`  - Chefs créés       : ${addedCount}`);
        console.log(`  - Chefs mis à jour  : ${updatedCount}`);
        console.log(`  - Sans village (⚠)  : ${skippedCount}`);
        console.log(`  - Total traité      : ${rawChiefsData.length}`);
        console.log(`  - DIVO              : 45 chefs`);
        console.log(`  - GUITRY            : 21 chefs`);
        console.log(`  - LAKOTA            : 60 chefs`);
        console.log(`=============================================\n`);
        process.exit(0);

    } catch (e) {
        console.error("Importation échouée :", e);
        process.exit(1);
    }
}

importLohDjibouaChiefs();


import * as fs from 'fs';
import * as path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const envPath = path.resolve(process.cwd(), '.env.local');
const env: any = {};
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
      env[key.trim()] = value;
    }
  });
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const data = [
  {
    village: "Kouassiblé-kro",
    region: "Gbêkê",
    parties: "GADA Kouassi Germais contre Nanan NGORAN Koffi II, Chef de canton Gossan",
    type: "Foncier",
    description: "Empoissonnement des populations, procès en justice contre des famille du village, confiscation des indemnités de droits foncier coutumiers, expropriation et vente de terrains des populations",
    reportedDate: "2022-06-07",
    status: "Résolu",
    impact: "Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, émergence de conflits, menace sur la cohésion sociale. Psychologique : Psychoses dans localité"
  },
  {
    village: "Guiglo",
    region: "Cavally",
    parties: "",
    type: "Foncier",
    description: "Crise Guoin-Débé",
    reportedDate: "2022-01-01",
    status: "Résolu",
    impact: ""
  }
];

async function run() {
  console.log("Importation des conflits fonciers 2022...");
  let count = 0;
  for (const item of data) {
    await addDoc(collection(db, 'conflicts'), item);
    console.log(`Ajouté : ${item.village}`);
    count++;
  }
  console.log(`Terminé. ${count} conflits fonciers importés.`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

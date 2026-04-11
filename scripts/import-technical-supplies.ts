
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc,
  writeBatch
} from 'firebase/firestore';

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a",
  measurementId: "G-TDXM581DZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORY_NAME = "Petits matériels et fournitures techniques";
const SYSCOHADA_ACCOUNT = "6215";
const IMPORT_DATE = "2026-01-31";
const TIMESTAMP = new Date(IMPORT_DATE).toISOString();

const supplies = [
    { name: "Escabeau alu ECOPLUS", quantity: 1 },
    { name: "Echelle simple PRONOR 5.2 m", quantity: 1 },
    { name: "Paquet de limes", quantity: 6 },
    { name: "Herbicide solution 480 SL Furagan Bidon de 1L", quantity: 13 },
    { name: "Extincteur de gaz carbonique 2kg", quantity: 1 },
    { name: "Herbicide glyphader 360 SL", quantity: 19 },
    { name: "Extincteur SILICE P9 ABC", quantity: 1 },
    { name: "Perceuse électrique BOSCH", quantity: 2 },
    { name: "Lame tondeuse TORO séries GTS Model : 29645", quantity: 0 },
    { name: "Balai métallique 22 dents", quantity: 0 },
    { name: "Cisaille à haie droite", quantity: 0 },
    { name: "Clé métallique n° 14", quantity: 0 },
    { name: "Pulvérisateur à dos 12 L Vert/Bleu lance", quantity: 1 },
    { name: "Arrosoir plastique 15 L", quantity: 1 },
    { name: "Machette caïman", quantity: 0 },
    { name: "Sécateur ingo", quantity: 0 },
    { name: "Gants T.9", quantity: 0 },
    { name: "Insecticide Super Cyper 50EC 1L", quantity: 23 },
    { name: "Insecticide Pyrimax 5G 1L", quantity: 2 },
    { name: "Engrais 2/6 (3 L)", quantity: 1 },
    { name: "Daba pour jardinage", quantity: 2 },
    { name: "Paire de bottes n° 42", quantity: 0 },
    { name: "Paire de bottes n° 45", quantity: 0 }
];

async function importSupplies() {
    console.log("Starting import with Client SDK...");

    // 1. Manage Category
    const categoriesRef = collection(db, 'supply_categories');
    const q = query(categoriesRef, where('name', '==', CATEGORY_NAME));
    const catSnap = await getDocs(q);
    
    let categoryId;
    if (catSnap.empty) {
        console.log(`Creating category: ${CATEGORY_NAME}`);
        const newCat = await addDoc(categoriesRef, {
            name: CATEGORY_NAME,
            syscohadaAccount: SYSCOHADA_ACCOUNT
        });
        categoryId = newCat.id;
    } else {
        categoryId = catSnap.docs[0].id;
        console.log(`Using existing category: ${CATEGORY_NAME} (${categoryId})`);
    }

    // 2. Import Supplies
    const suppliesRef = collection(db, 'supplies');
    const transactionsRef = collection(db, 'supply_transactions');

    for (let i = 0; i < supplies.length; i++) {
        const item = supplies[i];
        const code = `PMT-${String(i + 1).padStart(3, '0')}`;
        
        console.log(`Adding ${item.name} (${code})...`);
        
        const supplyData = {
            name: item.name,
            code: code,
            category: CATEGORY_NAME,
            quantity: item.quantity,
            reorderLevel: item.quantity > 0 ? 2 : 0,
            lastRestockDate: IMPORT_DATE,
            createdAt: TIMESTAMP,
            updatedAt: TIMESTAMP
        };

        const docRef = await addDoc(suppliesRef, supplyData);

        // 3. Log initial transaction if quantity > 0
        if (item.quantity > 0) {
            await addDoc(transactionsRef, {
                supplyId: docRef.id,
                supplyName: item.name,
                recipientName: "Stock Initial (Janv 2026)",
                quantity: item.quantity,
                date: IMPORT_DATE,
                timestamp: TIMESTAMP,
                type: 'restock',
                performedBy: 'system'
            });
        }
    }

    console.log("Import completed successfully!");
}

importSupplies().catch(err => {
    console.error("Import failed:", err);
    process.exit(1);
});

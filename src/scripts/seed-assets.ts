
import { collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Asset } from '@/lib/data';

// Data extracted from the user's image and CSV
const assetsData: (Omit<Asset, 'tag'> & { tag: string })[] = [
    // Laptops & Desktops from previous import
    { tag: "PT-HP-CNRCT-024", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5P", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-025", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5R", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-026", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5T", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-027", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5V", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-028", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5W", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-029", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G5X", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-030", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G60", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-031", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G61", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-032", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G62", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-033", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G63", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-034", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G64", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-035", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G65", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-036", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G66", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-037", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G67", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-038", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G68", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-039", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G69", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-040", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6B", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-041", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6C", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-042", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6D", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-043", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6F", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-044", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6G", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-045", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6H", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-046", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6J", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-047", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6K", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-048", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6L", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-049", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6M", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-050", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6N", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-051", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6P", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-052", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6Q", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-053", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6R", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-054", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6S", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-055", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6T", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-056", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6V", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-057", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6W", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-058", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6X", assignedTo: "Dir Cab", status: 'En utilisation' },
    { tag: "PT-HP-CNRCT-059", type: "Ordinateur", typeOrdinateur: "De Bureau", fabricant: "HP", modele: "Poste de Travail", numeroDeSerie: "8CG7403G6Z", assignedTo: "Dir Cab", status: 'En utilisation' },
    
    // New data from CSV
    { tag: "CNRCT-PC-001", type: "Ordinateur", typeOrdinateur: "Portable", fabricant: "Dell", modele: "Latitude 7490", numeroDeSerie: "ABC1234", status: 'En utilisation', assignedTo: "Koffi Jean-Luc" },
    { tag: "CNRCT-MON-002", type: "Moniteur", typeOrdinateur: undefined, fabricant: "Dell", modele: "UltraSharp U2721DE", numeroDeSerie: "XYZ5678", status: 'En utilisation', assignedTo: "Amoin Thérèse" },
    { tag: "CNRCT-IMP-001", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "LaserJet Pro M404dn", numeroDeSerie: "SDF910", status: 'En stock', assignedTo: "" },
    { tag: "CNRCT_STK_MYPASS1TO_001", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA830BJW", status: 'En utilisation', assignedTo: "ETTIEN ERIC" },
    { tag: "CNRCT_STK_MYPASS1TO_002", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA82XTR3", status: 'En utilisation', assignedTo: "EDOUKOU DOMINIQUE" },
    { tag: "CNRCT_STK_MYPASS1TO_003", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA82XLFR", status: 'Retiré', assignedTo: "ZADI TENIN EDITH" },
    { tag: "CNRCT_STK_MYPASS1TO_004", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA82XRMF", status: 'En utilisation', assignedTo: "KONATE JEANNE" },
    { tag: "CNRCT_STK_MYPASS1TO_005", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA82ZRSD", status: 'En utilisation', assignedTo: "KOUASSI ANNAISE" },
    { tag: "CNRCT_STK_MYPASS1TO_006", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NA8318GK", status: 'En stock', assignedTo: "" },
    { tag: "CNRCT_STK_MYPASS1TO_007", type: "Autre", typeOrdinateur: undefined, fabricant: "WD", modele: "My Passport 1 To Noir", numeroDeSerie: "NAAXCGN7", status: 'En utilisation', assignedTo: "ALLAH GOLI EDMOND" },
    { tag: "CNRCT_IMP_HP_", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "Color LaserJet Pro MFP M177fw", numeroDeSerie: "CNG6HBY1KJ", status: 'En utilisation', assignedTo: "KOUASSI ANNE MARCELLE" },
    { tag: "PRINT_CO_01", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "Color LaserJet Pro MFP M177fw", numeroDeSerie: "CNG6HBY1HN", status: 'En utilisation', assignedTo: "DIRECTION DES AFFAIRES FINANCIERES ET DU PATRIMOINE" },
    { tag: "PRINT_CO_03", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "Color LaserJet Pro MFP M177fw", numeroDeSerie: "CNG6HBY1MP", status: 'En utilisation', assignedTo: "SERVICE INFORMATIQUE" },
    { tag: "PRINT_B-N_001", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9H916C3", status: 'En utilisation', assignedTo: "ALLAH GOLI EDMOND" },
    { tag: "PRINT_B-N_002", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9H916C9", status: 'En utilisation', assignedTo: "KOUASSI ANNE MARCELLE" },
    { tag: "PRINT_B-N_003", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9G2Q01W", status: 'En utilisation', assignedTo: "AMANI KOUASSI" },
    { tag: "PRINT_B-N_004", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9H916GY", status: 'En utilisation', assignedTo: "POOL SECRETARIAT" },
    { tag: "PRINT_B-N_005", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9G2PKFQ", status: 'En utilisation', assignedTo: "SECRETARIAT GENERAL" },
    { tag: "PRINT_B-N_006", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9G2Q00Q", status: 'En utilisation', assignedTo: "DAVID ELOISE" },
    { tag: "PRINT_B-N_007", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9H916GJ", status: 'En utilisation', assignedTo: "POOL PERSONNEL DAFP" },
    { tag: "PRINT_B-N_008", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9G2QOOH", status: 'En utilisation', assignedTo: "TANOE AMON PAUL DESIRE" },
    { tag: "PRINT_B-N_009", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fn", numeroDeSerie: "CNB9G2Q00Q", status: 'En utilisation', assignedTo: "COULIBALY HAMADOU" },
    { tag: "PRINT_B-N_010", type: "Imprimante", typeOrdinateur: undefined, fabricant: "HP", modele: "laserjet pro mfp M127fw", numeroDeSerie: "CNB8H3DL8L", status: 'En utilisation', assignedTo: "POOL ASSISTANT" },
];

async function seedAssets() {
    const assetsCollectionRef = collection(db, 'assets');
    const batch = writeBatch(db);
    
    const tags = assetsData.map(a => a.tag);
    const existingTags = new Set<string>();

    for (let i = 0; i < tags.length; i += 30) {
        const chunk = tags.slice(i, i + 30);
        if (chunk.length > 0) {
            const q = query(assetsCollectionRef, where('__name__', 'in', chunk));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => existingTags.add(doc.id));
        }
    }

    let addedCount = 0;
    assetsData.forEach(asset => {
        if (!existingTags.has(asset.tag)) {
            const docRef = doc(assetsCollectionRef, asset.tag);
            const { tag, ...dataToSave } = asset;
            
            // Explicitly handle undefined for typeOrdinateur
            const finalData: Partial<Asset> = { ...dataToSave };
            if (finalData.type !== 'Ordinateur') {
                delete finalData.typeOrdinateur;
            }

            batch.set(docRef, finalData);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        await batch.commit();
        console.log(`Successfully seeded ${addedCount} new assets.`);
    } else {
        console.log("No new assets to seed. All items from the list already exist.");
    }
}

async function main() {
    try {
        console.log("Starting asset seeding...");
        await seedAssets();
        console.log("Asset seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding assets:", error);
    }
}

main();


import { collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Asset } from '@/lib/data';

// Data extracted from the user's image
const assetsData: (Omit<Asset, 'tag'> & { tag: string })[] = [
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
            batch.set(docRef, {
                type: asset.type,
                typeOrdinateur: asset.typeOrdinateur,
                fabricant: asset.fabricant,
                modele: asset.modele,
                numeroDeSerie: asset.numeroDeSerie,
                assignedTo: asset.assignedTo,
                status: asset.status,
            });
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

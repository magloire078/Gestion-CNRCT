
import { db } from '../lib/firebase';
import { writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { roleData, userData } from '../lib/data';

async function seedCollection(collectionName: string, data: any[]) {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef);
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        console.log(`Collection "${collectionName}" already contains data. Skipping seed.`);
        return;
    }

    const batch = writeBatch(db);
    data.forEach((item) => {
        // We let Firestore generate the ID, so we don't pass item.id
        const { id, ...rest } = item;
        const docRef = collection(db, collectionName).doc();
        batch.set(docRef, rest);
    });

    try {
        await batch.commit();
        console.log(`Successfully seeded collection: ${collectionName}`);
    } catch (error) {
        console.error(`Error seeding collection ${collectionName}:`, error);
        throw error;
    }
}

async function main() {
    console.log("Starting database seeding...");
    try {
        if (!db) {
            throw new Error("Firestore is not initialized. Aborting seed.");
        }
        await seedCollection('users', userData);
        await seedCollection('roles', roleData);
        // Add other collections to seed here if needed in the future
        // await seedCollection('employees', employeeData); 
        // etc.
        console.log("Database seeding completed successfully!");
    } catch (error) {
        console.error("An error occurred during database seeding:", error);
    }
}

main().then(() => {
    // The script doesn't exit automatically in some environments.
    process.exit(0);
}).catch(() => {
    process.exit(1);
});


import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, deleteDoc, where } from '@/lib/firebase';

export interface SupplyCategory {
    id: string;
    name: string;
    syscohadaAccount?: string;
}

const categoriesCollection = collection(db, 'supply_categories');

/**
 * Subscribe to the real-time list of categories.
 */
export function subscribeToCategories(
    callback: (categories: SupplyCategory[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(categoriesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const categories = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as SupplyCategory));
            callback(categories);
        },
        (error) => {
            console.error("Error subscribing to categories:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

/**
 * Retrieve all categories once.
 */
export async function getCategories(): Promise<SupplyCategory[]> {
    const snapshot = await getDocs(query(categoriesCollection, orderBy("name", "asc")));
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    } as SupplyCategory));
}

/**
 * Add a new category.
 */
export async function addCategory(categoryData: Omit<SupplyCategory, 'id'>): Promise<string> {
    const docRef = await addDoc(categoriesCollection, categoryData);
    return docRef.id;
}

/**
 * Update an existing category.
 */
export async function updateCategory(id: string, data: Partial<SupplyCategory>): Promise<void> {
    const categoryDocRef = doc(db, 'supply_categories', id);
    await updateDoc(categoryDocRef, data);
}

/**
 * Delete a category.
 */
export async function deleteCategory(id: string): Promise<void> {
    const categoryDocRef = doc(db, 'supply_categories', id);
    await deleteDoc(categoryDocRef);
}

/**
 * Initialize default categories if the collection is empty.
 */
export async function seedDefaultCategories(defaultCategories: string[]) {
    const existing = await getCategories();
    if (existing.length === 0) {
        console.log("Seeding default supply categories...");
        for (const name of defaultCategories) {
            let syscohadaAccount = '';
            if (name === 'Papeterie') syscohadaAccount = '602';
            else if (name === 'Fourniture de bureau et documentation') syscohadaAccount = '6211';
            else if (name === 'Cartouches d\'encre' || name === 'Matériel et fournitures d\'entretien' || name === 'Fourniture et consommables pour le materiel informatique') syscohadaAccount = '606';
            else syscohadaAccount = '606';
            
            await addCategory({ name, syscohadaAccount });
        }
    }
}


import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const db = adminDb;

export async function GET() {
    try {
        const OLD_NAMES = [
            "Fourniture de bureau et documentation",
            "Fournitures de bureau et documentation"
        ];
        const NEW_NAME = "Petits matériels, fourniture de bureau et documentation";
        const SYSCOHADA_ACCOUNT = "6211";

        console.log(`🚀 ADMIN API Migration Triggered to "${NEW_NAME}"...`);

        // 1. Update the category document
        const categoriesRef = db.collection('supply_categories');
        const catSnap = await categoriesRef.where('syscohadaAccount', '==', SYSCOHADA_ACCOUNT).get();

        if (!catSnap.empty) {
            await catSnap.docs[0].ref.update({ name: NEW_NAME });
        }

        // 2. Update all supplies
        const suppliesRef = db.collection('supplies');
        const allSupplies = await suppliesRef.get();
        
        const toUpdate = allSupplies.docs.filter(d => {
            const cat = d.data().category;
            return typeof cat === 'string' && OLD_NAMES.some(old => cat.trim().toLowerCase() === old.toLowerCase());
        });

        console.log(`Found ${toUpdate.length} supplies to update via ADMIN API.`);

        const batch = db.batch();
        for (const document of toUpdate) {
            batch.update(document.ref, { category: NEW_NAME });
        }

        if (toUpdate.length > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, updated: toUpdate.length });
    } catch (error: any) {
        console.error("Admin Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

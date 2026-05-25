import { NextResponse } from 'next/server';
import { collection, getDocs, db, writeBatch, doc } from '@/lib/firebase';

export async function GET() {
    try {
        const collectionRef = collection(db, 'villages');
        const snapshot = await getDocs(collectionRef);
        
        let totalCount = 0;
        let campementCount = 0;
        let villageCount = 0;
        let batches = [];
        let currentBatch = writeBatch(db);
        let operationsInCurrentBatch = 0;

        for (const document of snapshot.docs) {
            totalCount++;
            const data = document.data();
            const name = data.name || '';
            
            // Logique de détection des campements : 
            // 1. Contient "campement", "cpt"
            // 2. Se termine par un chiffre (ex: GOKRA 1, GOKRA 2)
            // 3. Se termine par un chiffre romain commun (I, II, III, IV, V, VI)
            const isCampement = 
                /campement|cpt\b/i.test(name) || 
                /\b[1-9]\b$/.test(name.trim()) ||
                /\b(I|II|III|IV|V|VI)\b$/.test(name.trim());

            if (isCampement && data.type !== 'campement') {
                const docRef = doc(db, 'villages', document.id);
                currentBatch.update(docRef, { type: 'campement' });
                campementCount++;
                operationsInCurrentBatch++;
            } else if (!isCampement && data.type !== 'village') {
                const docRef = doc(db, 'villages', document.id);
                currentBatch.update(docRef, { type: 'village' });
                villageCount++;
                operationsInCurrentBatch++;
            }
            
            // Firestore batch limit is 500
            if (operationsInCurrentBatch === 490) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationsInCurrentBatch = 0;
            }
        }

        if (operationsInCurrentBatch > 0) {
            batches.push(currentBatch);
        }

        // Commit all batches
        for (const b of batches) {
            await b.commit();
        }

        return NextResponse.json({ 
            success: true, 
            message: `Traitement de classification terminé.`,
            stats: {
                totalScanned: totalCount,
                newCampementsFlagged: campementCount,
                newVillagesFlagged: villageCount,
                batchesProcessed: batches.length
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

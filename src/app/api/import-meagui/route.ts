import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, db, writeBatch, doc } from '@/lib/firebase';
import { requireSuperAdmin } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    // Endpoint d'import ponctuel : 3 requêtes / IP / heure
    const rl = rateLimit(req, { max: 3, windowMs: 3_600_000 });
    if (!rl.ok) return rl.response;

    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;
    try {
        const villages = [
            "Abodagui",
            "Adamagui",
            "Ahoutouagui",
            "Amaragui",
            "Amoragui",
            "Anagba",
            "Angagui",
            "Gnititouagui",
            "Gnititouagui 2",
            "Guiré",
            "Ipouagui",
            "Kouadioagui",
            "Kouakouagui",
            "Méagui-Village",
            "Touagui",
            "Touagui 2",
            "Touanié",
            "Walèbo"
        ];

        const batch = writeBatch(db);
        const collectionRef = collection(db, 'villages');
        
        let count = 0;

        for (const vName of villages) {
            // Check if it already exists to avoid duplicates
            const q = query(
                collectionRef, 
                where('name', '==', vName),
                where('subPrefecture', '==', 'Méagui')
            );
            
            const snapshot = await getDocs(q);
                
            if (snapshot.empty) {
                const docRef = doc(collectionRef);
                batch.set(docRef, {
                    id: docRef.id,
                    name: vName,
                    region: "Nawa",
                    department: "Méagui",
                    subPrefecture: "Méagui",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                count++;
            }
        }

        if (count > 0) {
            await batch.commit();
        }

        return NextResponse.json({ 
            success: true, 
            message: `Inserted ${count} villages into Méagui successfully.`,
            alreadyExisted: villages.length - count
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

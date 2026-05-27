import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const chiefsRef = adminDb.collection('chiefs');
    const snapshot = await chiefsRef.get();
    
    const chiefs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    const seen = new Map();
    const duplicates = [];
    
    for (const chief of chiefs) {
      const name = (chief.name || '').trim().toLowerCase();
      const key = name;
      
      if (!key || key === '_') continue;
      
      if (seen.has(key)) {
        duplicates.push(chief.id);
      } else {
        seen.set(key, chief.id);
      }
    }
    
    if (duplicates.length > 0) {
      const batch = adminDb.batch();
      // Firestore batch deletes have a limit of 500 operations per batch
      const maxBatchSize = 400;
      for (let i = 0; i < duplicates.length; i += maxBatchSize) {
        const chunk = duplicates.slice(i, i + maxBatchSize);
        const chunkBatch = adminDb.batch();
        for (const id of chunk) {
          chunkBatch.delete(chiefsRef.doc(id));
        }
        await chunkBatch.commit();
      }
      return NextResponse.json({ success: true, message: `Deleted ${duplicates.length} duplicate chiefs.` });
    }
    
    return NextResponse.json({ success: true, message: 'No duplicates found.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

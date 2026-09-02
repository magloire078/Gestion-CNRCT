import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth, requireAppCheck } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * API pour récupérer l'annuaire simplifié des employés.
 * Exclut volontairement les champs sensibles (salaires, banques, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const appCheckError = await requireAppCheck(req);
    if (appCheckError) return appCheckError;

    const { errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    if (!adminDb) {
      console.error('[API Employees Directory] adminDb is not initialized');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const employeesRef = adminDb.collection('employees');
    const snapshot = await employeesRef.get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    // Filtrage des champs pour ne renvoyer que le strict nécessaire
    const directory = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lastName: data.lastName || '',
        firstName: data.firstName || '',
        name: data.name || `${data.lastName || ''} ${data.firstName || ''}`.trim(),
        matricule: data.matricule || '',
        poste: data.poste || '',
        photoUrl: data.photoUrl || '',
        status: data.status,
        departmentId: data.departmentId || '',
        Region: data.Region || '',
        Departement: data.Departement || ''
      };
    });

    // Tri par nom
    directory.sort((a, b) => a.lastName.localeCompare(b.lastName));

    return NextResponse.json(directory);
  } catch (error: any) {
    console.error('[API Employees Directory] Error:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'annuaire', detail: error.message }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

/**
 * API pour récupérer l'annuaire simplifié des employés.
 * Exclut volontairement les champs sensibles (salaires, banques, etc.)
 * Nécessite un ID token Firebase valide (Bearer) — voir src/lib/api-auth.ts
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    if (!adminDb) {
      console.error('[API Employees Directory] adminDb is not initialized');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const employeesRef = adminDb.collection('employees');
    const snapshot = await employeesRef
      .where('status', 'in', ['Actif', 'En congé'])
      .get();

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
        departmentId: data.departmentId || ''
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

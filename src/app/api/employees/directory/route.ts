import { NextResponse, type NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * API pour récupérer l'annuaire simplifié des employés.
 * Exclut volontairement les champs sensibles (salaires, banques, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      console.error('[API Employees Directory] adminDb/adminAuth is not initialized');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length).trim();
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const employeesRef = adminDb.collection('employees');
    const snapshot = await employeesRef
      .where('status', 'in', ['Actif', 'En congé'])
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

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

    directory.sort((a, b) => a.lastName.localeCompare(b.lastName));

    return NextResponse.json(directory);
  } catch (error: any) {
    console.error('[API Employees Directory] Error:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'annuaire' },
      { status: 500 }
    );
  }
}

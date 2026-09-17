import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAppCheck } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const DIRECTOIRE_DEPT_ID = '9ywKFDgVMS86rZLPYhpm';

const DIRECTOIRE_MATRICULE_PREFIXES = ['DIR', 'PRE', 'D 0'];

const DIRECTOIRE_POSTE_KEYWORDS = [
  'president',
  'secretaire general',
  'secrétaire général',
  'membre du directoire',
  'membre du bureau',
  'directrice de cabinet',
  'directeur de cabinet',
  'point focal',
];

/**
 * Bureau du Directoire affiché sur la page d'accueil publique.
 *
 * La page interrogeait Firestore directement, ce qui obligeait les règles à
 * ouvrir /employees en lecture anonyme — donnant accès à la fiche entière
 * (salaire, RIB, données personnelles) alors que l'accueil n'affiche qu'un
 * nom, un poste et une photo. Cette route ne renvoie que ces champs.
 */

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function isPresidentPoste(poste: string = ''): boolean {
  const p = normalize(poste);
  if (!p.includes('president')) return false;
  if (p.includes('vice')) return false;
  const isSupportStaff = [
    'secretar', 'secreta', 'cabinet', 'assistant', 'assistante', 
    'conseil', 'charge', 'chauffeur', 'aide', 'protocole', 'garde', 'directeur', 'directrice'
  ].some(ex => p.includes(ex));
  return !isSupportStaff;
}

function isDirectoireMember(data: FirebaseFirestore.DocumentData): boolean {
  if (data.status && data.status !== 'Actif' && data.status !== 'En congé' && data.status !== 'actif') return false;

  const poste = normalize(data.poste || '');
  const isSupportStaff = [
    'secretariat', 'secretaire', 'assistant', 'assistante', 
    'chauffeur', 'protocole', 'garde', 'charge de mission', 'chargee de mission'
  ].some(kw => poste.includes(kw)) && !poste.includes('secretaire general');

  if (isSupportStaff) return false;

  if (data.departmentId === DIRECTOIRE_DEPT_ID) return true;

  const matricule: string = data.matricule || '';
  if (DIRECTOIRE_MATRICULE_PREFIXES.some((prefix) => matricule.startsWith(prefix))) return true;

  return poste.length > 0 && DIRECTOIRE_POSTE_KEYWORDS.some((keyword) => poste.includes(normalize(keyword)));
}

function rankOf(poste: string = ''): number {
  const p = normalize(poste);
  if (isPresidentPoste(p)) return 1;
  if (p.includes('1er vice-president') || p.includes('premier vice-president')) return 2;
  if (p.includes('2eme vice-president') || p.includes('deuxieme vice-president')) return 3;
  if (p.includes('3eme vice-president') || p.includes('troisieme vice-president')) return 4;
  if (p.includes('4eme vice-president') || p.includes('quatrieme vice-president')) return 5;
  if (p.includes('5eme vice-president') || p.includes('cinquieme vice-president')) return 6;
  if (p.includes('vice-president')) return 6.5;
  if (p.includes('secretaire general')) return 7;
  if (p.includes('directrice de cabinet') || p.includes('directeur de cabinet')) return 7.5;
  if (p.includes('membre du bureau')) return 8;
  if (p.includes('membre du directoire')) return 9;
  return 99;
}

export async function GET(req: NextRequest) {
  try {
    const appCheckToken = req.headers.get('X-Firebase-AppCheck');
    if (appCheckToken) {
      const appCheckError = await requireAppCheck(req);
      if (appCheckError) {
        console.warn('[Institution Directoire] Invalid AppCheck token, proceeding with public safe fields.');
      }
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    const snapshot = await adminDb.collection('employees').get();

    const members = snapshot.docs
      .filter((doc) => isDirectoireMember(doc.data()))
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || `${data.lastName || ''} ${data.firstName || ''}`.trim(),
          poste: data.poste || '',
          photoUrl: data.photoUrl || '',
          status: data.status || 'Actif',
          Region: data.Region || null,
        };
      })
      .sort((a, b) => rankOf(a.poste) - rankOf(b.poste));

    return NextResponse.json(members);
  } catch (error) {
    console.error('[Institution Directoire] Unexpected error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement.' }, { status: 500 });
  }
}

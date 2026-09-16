import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAppCheck } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Suivi public d'une plainte MGP par numéro de récépissé.
 *
 * Cette route est le SEUL accès anonyme aux dossiers : les règles Firestore
 * gardent /conflicts fermé aux visiteurs non authentifiés. Elle ne renvoie
 * donc qu'un sous-ensemble non identifiant du dossier — jamais la
 * description, les parties, la localisation précise, le médiateur ni les
 * notes internes.
 */

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Compteur par IP et par fenêtre, stocké dans Firestore : sur Vercel les
 * instances serverless ne partagent aucune mémoire, un compteur en RAM ne
 * limiterait donc rien.
 */
async function isRateLimited(ip: string): Promise<boolean> {
  if (!adminDb) return false;

  const windowIndex = Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW_SECONDS);
  const key = `${ip}_${windowIndex}`.replace(/\//g, '_');
  const ref = adminDb.collection('mgp_rate_limits').doc(key);

  try {
    const snapshot = await ref.get();
    const count = snapshot.exists ? (snapshot.data()?.count || 0) : 0;

    if (count >= RATE_LIMIT_MAX_REQUESTS) return true;

    await ref.set(
      {
        count: count + 1,
        expiresAt: new Date((windowIndex + 2) * RATE_LIMIT_WINDOW_SECONDS * 1000),
      },
      { merge: true }
    );
    return false;
  } catch (error) {
    console.error('[MGP Track] Rate limit check failed:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const appCheckError = await requireAppCheck(req);
    if (appCheckError) return appCheckError;

    const trackingId = req.nextUrl.searchParams.get('trackingId')?.trim().toUpperCase();

    if (!trackingId || trackingId.length < 6 || trackingId.length > 40) {
      return NextResponse.json({ error: 'Numéro de suivi invalide.' }, { status: 400 });
    }

    if (await isRateLimited(getClientIp(req))) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans une minute.' },
        { status: 429 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    const snapshot = await adminDb
      .collection('conflicts')
      .where('trackingId', '==', trackingId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ found: false });
    }

    const data = snapshot.docs[0].data();

    return NextResponse.json({
      found: true,
      trackingId: data.trackingId,
      status: data.status,
      type: data.type,
      reportedDate: data.reportedDate,
      resolutionDate: data.resolutionDate || null,
    });
  } catch (error) {
    console.error('[MGP Track] Unexpected error:', error);
    return NextResponse.json({ error: 'Erreur lors de la recherche.' }, { status: 500 });
  }
}

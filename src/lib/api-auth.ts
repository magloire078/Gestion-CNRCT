/**
 * Helper d'authentification pour les routes API Next.js (src/app/api/**).
 *
 * Chaque route sensible DOIT commencer par un appel à l'un de ces helpers,
 * sinon la route est exposée sans auth à tout Internet.
 *
 * Usage :
 *   export async function GET(req: NextRequest) {
 *     const auth = await requireAuth(req);
 *     if (!auth.ok) return auth.response;
 *     // ...
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

type AuthOk = {
    ok: true;
    uid: string;
    email: string | null;
    isSuperAdmin: boolean;
};
type AuthFail = {
    ok: false;
    response: NextResponse;
};

const SUPER_ADMIN_ROLE_IDS = ['super-admin', 'LHcHyfBzile3r0vyFOFb', 'dirigeant-president'];
const SUPER_ADMIN_EMAILS = ['magloire078@gmail.com'];

/**
 * Vérifie un Bearer token Firebase dans l'en-tête Authorization.
 * Le client doit envoyer : `Authorization: Bearer <ID_TOKEN>`
 * L'ID token est récupérable côté client via `getIdToken()` du SDK Firebase Auth.
 */
export async function requireAuth(req: NextRequest): Promise<AuthOk | AuthFail> {
    if (!adminAuth) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 }),
        };
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 }),
        };
    }

    try {
        const decoded = await adminAuth.verifyIdToken(match[1]);
        // Lookup roleId to determine super-admin status
        let isSuperAdmin = SUPER_ADMIN_EMAILS.includes(decoded.email || '');
        if (!isSuperAdmin && adminDb) {
            const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
            const roleId = userDoc.data()?.roleId;
            if (roleId && SUPER_ADMIN_ROLE_IDS.includes(roleId)) isSuperAdmin = true;
        }
        return { ok: true, uid: decoded.uid, email: decoded.email ?? null, isSuperAdmin };
    } catch (err) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
        };
    }
}

/**
 * Version plus stricte : refuse si l'utilisateur n'est pas super-admin.
 * À utiliser sur les routes de maintenance/migration/import qui doivent
 * rester réservées aux administrateurs.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<AuthOk | AuthFail> {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth;
    if (!auth.isSuperAdmin) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 }),
        };
    }
    return auth;
}

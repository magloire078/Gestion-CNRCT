import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface AuthContext {
  uid: string;
  email?: string;
  roleId?: string;
}

/**
 * Extract token from Authorization header and verify it via Firebase Admin
 */
async function verifyBearerToken(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check role by querying Firestore user document
    let roleId = undefined;
    if (adminDb) {
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
            roleId = userDoc.data()?.roleId;
        }
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      roleId
    };
  } catch (error) {
    console.error('[API Auth] Error verifying token:', error);
    return null;
  }
}

/**
 * Validates that the request has a valid Firebase auth token.
 * Returns the AuthContext if valid, or a 401 NextResponse if invalid.
 */
export async function requireAuth(req: NextRequest): Promise<{ auth: AuthContext | null, errorResponse?: NextResponse }> {
  const auth = await verifyBearerToken(req);
  if (!auth) {
    return { auth: null, errorResponse: NextResponse.json({ error: 'Unauthorized. Bearer token missing or invalid.' }, { status: 401 }) };
  }
  return { auth };
}

/**
 * Validates that the request has a valid Firebase auth token AND the user is a super admin.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<{ auth: AuthContext | null, errorResponse?: NextResponse }> {
  const { auth, errorResponse } = await requireAuth(req);
  if (errorResponse) return { auth, errorResponse };

  // Allow fallback super-admin email or check role
  const isSuperAdmin = auth?.email === 'magloire078@gmail.com' || 
                       auth?.roleId === 'super-admin' || 
                       auth?.roleId === 'LHcHyfBzile3r0vyFOFb' || 
                       auth?.roleId === 'dirigeant-president';

  if (!isSuperAdmin) {
    return { auth, errorResponse: NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 }) };
  }

  return { auth };
}

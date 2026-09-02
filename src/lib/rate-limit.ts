/**
 * Rate limiter en mémoire pour les routes API Next.js.
 *
 * Approche pragmatique : compteur par clé (IP par défaut) en Map JS, avec
 * fenêtre glissante et purge automatique. Fonctionne sur un même instance
 * serverless "chaud" — sur un déploiement multi-instances (Vercel/Firebase
 * Functions), le compteur est effectivement partagé par instance, pas
 * globalement. C'est suffisant pour bloquer les abus casuels et les scripts
 * curl répétitifs, mais PAS pour un DDoS distribué (utiliser Cloudflare ou
 * Firebase App Check pour ça).
 *
 * Usage :
 *   import { rateLimit } from '@/lib/rate-limit';
 *
 *   export async function GET(req: NextRequest) {
 *     const rl = rateLimit(req, { max: 20, windowMs: 60_000 });
 *     if (!rl.ok) return rl.response;
 *     // ...
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';

interface Bucket {
    count: number;
    resetAt: number;
}

const store = new Map<string, Bucket>();

// Purge périodique des buckets expirés pour éviter la fuite mémoire.
// S'exécute au max une fois par 5 minutes, seulement quand une nouvelle requête arrive.
let lastPurge = 0;
function purgeIfNeeded(now: number) {
    if (now - lastPurge < 300_000) return;
    lastPurge = now;
    for (const [key, bucket] of store.entries()) {
        if (bucket.resetAt <= now) store.delete(key);
    }
}

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real.trim();
    // Fallback : impossible à obtenir de façon fiable dans NextRequest.
    // On regroupe alors tous les appelants sans IP sous un seul compteur.
    return 'unknown';
}

interface RateLimitOptions {
    max: number;         // nb requêtes autorisées dans la fenêtre
    windowMs: number;    // taille de la fenêtre en millisecondes
    key?: string;        // clé personnalisée (par défaut = IP)
}

type RateLimitOk = { ok: true; remaining: number; resetAt: number };
type RateLimitFail = { ok: false; response: NextResponse; retryAfterSec: number };

export function rateLimit(req: NextRequest, options: RateLimitOptions): RateLimitOk | RateLimitFail {
    const { max, windowMs } = options;
    const now = Date.now();
    purgeIfNeeded(now);

    const key = options.key || `ip:${getClientIp(req)}:${req.nextUrl.pathname}`;
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: max - 1, resetAt: now + windowMs };
    }

    if (existing.count >= max) {
        const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        return {
            ok: false,
            retryAfterSec,
            response: new NextResponse(
                JSON.stringify({ error: 'Rate limit exceeded', retryAfterSec }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(retryAfterSec),
                        'X-RateLimit-Limit': String(max),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(existing.resetAt / 1000)),
                    },
                },
            ),
        };
    }

    existing.count += 1;
    return { ok: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

/**
 * Ajoute les headers X-RateLimit-* sur une NextResponse existante.
 * Utile après une réponse OK pour informer le client de son quota restant.
 */
export function withRateLimitHeaders(res: NextResponse, rl: RateLimitOk, max: number): NextResponse {
    res.headers.set('X-RateLimit-Limit', String(max));
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    res.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return res;
}

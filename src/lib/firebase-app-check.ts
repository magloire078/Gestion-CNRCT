/**
 * Firebase App Check — atteste que les requêtes proviennent bien
 * de votre application web légitime, pas d'un curl / script hostile
 * ou d'un client abusif.
 *
 * Fonctionnement : reCAPTCHA v3 (invisible, aucune interaction utilisateur)
 * produit un token qui est joint automatiquement à chaque requête Firestore /
 * Auth / Storage / Functions. Le back-end vérifie le token et refuse la
 * requête si absent ou invalide (403).
 *
 * ⚠️ Pré-requis côté Firebase Console (à faire UNE fois) :
 *   1. https://console.firebase.google.com/ → App Check
 *   2. Register app → reCAPTCHA v3 → coller votre site key
 *   3. Récupérer la site key et la mettre dans NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 *   4. Pour chaque service (Firestore, Auth, Storage, Functions), passer
 *      l'enforcement en mode « Enforce » quand vous êtes sûr que les clients
 *      légitimes envoient bien le token (surveiller les métriques dans la
 *      console avant).
 *
 * ⚠️ Développement local :
 *    Localhost ne peut pas passer reCAPTCHA. Deux options :
 *    A. Mettre NEXT_PUBLIC_APP_CHECK_DEBUG=true dans .env.local. Au premier
 *       chargement, un debug token apparaît dans la console. Copier-coller
 *       ce token dans Firebase Console → App Check → Apps → Debug tokens
 *       pour le whitelister.
 *    B. Laisser App Check désactivé en dev (ne rien mettre dans
 *       NEXT_PUBLIC_RECAPTCHA_SITE_KEY) — l'app fonctionne normalement mais
 *       sans la protection App Check.
 */

import { getApp } from 'firebase/app';

let initialized = false;

/**
 * Initialise App Check si les variables d'env sont présentes et si
 * on est côté navigateur. À appeler UNE seule fois au démarrage du client.
 */
export async function initFirebaseAppCheck(): Promise<void> {
    if (initialized) return;
    if (typeof window === 'undefined') return;

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const enableDebug = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG === 'true';

    // Sans site key configurée, on skip silencieusement (App Check désactivé).
    // Utile en dev pour ne pas casser une équipe sans reCAPTCHA configuré.
    if (!siteKey || siteKey === 'undefined' || siteKey.trim() === '') {
        return;
    }

    // Debug token : à activer UNIQUEMENT en dev. Firebase loggue alors un
    // token à copier dans la console pour whitelister le poste.
    if (enableDebug) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
        initializeAppCheck(getApp(), {
            provider: new ReCaptchaV3Provider(siteKey),
            // Rafraîchit automatiquement le token avant expiration pour ne pas
            // bloquer les requêtes de longue durée.
            isTokenAutoRefreshEnabled: true,
        });
        initialized = true;
    } catch (err) {
        console.warn('[AppCheck] Initialization failed:', err);
    }
}

/**
 * Service MFA (Multi-Factor Authentication) — Firebase TOTP.
 *
 * Deux flux :
 *   1. Enrôlement : depuis /settings/security, un utilisateur ajoute son
 *      téléphone comme second facteur via une app d'authentification
 *      (Google Authenticator, Microsoft Authenticator, 1Password…).
 *   2. Challenge : à la connexion, si le compte a MFA activé, Firebase renvoie
 *      une erreur `auth/multi-factor-auth-required`. On propose un input pour
 *      le code TOTP puis on résout le challenge.
 *
 * ⚠️ Pré-requis côté Firebase Console :
 *      Authentication → Sign-in method → Multi-factor authentication → Enable TOTP
 *
 * ⚠️ Firebase exige une réauthentification récente pour toute mutation MFA
 *    (enrôlement, désenrôlement). L'appelant doit préalablement rappeler
 *    l'utilisateur avec `reauthenticateWithCredential(...)` sinon l'appel
 *    renverra `auth/requires-recent-login`.
 */

import {
    multiFactor,
    TotpMultiFactorGenerator,
    TotpSecret,
    getMultiFactorResolver,
    MultiFactorResolver,
    MultiFactorError,
    MultiFactorInfo,
    User,
    reauthenticateWithCredential,
    EmailAuthProvider,
    UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Liste des facteurs déjà enrôlés pour un utilisateur.
 */
export function getEnrolledFactors(user: User): MultiFactorInfo[] {
    return multiFactor(user).enrolledFactors;
}

/**
 * Réauthentifie l'utilisateur courant avec son mot de passe.
 * Requis avant chaque mutation MFA (enrôlement / désenrôlement).
 */
export async function reauthenticateWithPassword(user: User, password: string): Promise<UserCredential> {
    if (!user.email) throw new Error("Impossible de réauthentifier : aucun email associé au compte.");
    const cred = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, cred);
}

export interface TotpEnrollmentStart {
    secret: TotpSecret;
    otpauthUri: string;
    qrCodeUrl: string;   // Google Chart QR (fallback simple, la plupart des apps scannent l'URI directement)
    manualEntryKey: string;
}

/**
 * Démarre l'enrôlement TOTP. Renvoie le secret + une URI otpauth:// que l'utilisateur
 * doit scanner ou saisir manuellement dans son app d'authentification.
 * L'utilisateur doit ensuite appeler finishTotpEnrollment() avec le code à 6 chiffres.
 */
export async function startTotpEnrollment(user: User, accountName: string, issuer = 'CNRCT'): Promise<TotpEnrollmentStart> {
    const session = await multiFactor(user).getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(session);
    const otpauthUri = secret.generateQrCodeUrl(accountName, issuer);
    // Google Chart API génère un QR à partir d'une URL — pratique et sans nouvelle dep.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUri)}`;
    return {
        secret,
        otpauthUri,
        qrCodeUrl,
        manualEntryKey: secret.secretKey,
    };
}

/**
 * Termine l'enrôlement TOTP : Firebase vérifie le code et enregistre le second facteur.
 */
export async function finishTotpEnrollment(
    user: User,
    secret: TotpSecret,
    verificationCode: string,
    displayName: string,
): Promise<void> {
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, verificationCode);
    await multiFactor(user).enroll(assertion, displayName);
}

/**
 * Retire un facteur MFA. `factor` = l'un des éléments de `getEnrolledFactors()`.
 */
export async function unenrollFactor(user: User, factor: MultiFactorInfo): Promise<void> {
    await multiFactor(user).unenroll(factor);
}

/**
 * Vérifie si une erreur de connexion est une demande de MFA challenge.
 */
export function isMfaChallengeError(error: unknown): boolean {
    return !!error && typeof error === 'object' && (error as any).code === 'auth/multi-factor-auth-required';
}

/**
 * Récupère le resolver pour finaliser un challenge TOTP.
 */
export function getMfaResolver(error: MultiFactorError): MultiFactorResolver {
    return getMultiFactorResolver(auth, error);
}

/**
 * Termine le challenge TOTP avec le code à 6 chiffres.
 */
export async function resolveTotpChallenge(
    resolver: MultiFactorResolver,
    factor: MultiFactorInfo,
    verificationCode: string,
): Promise<UserCredential> {
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(factor.uid, verificationCode);
    return resolver.resolveSignIn(assertion);
}

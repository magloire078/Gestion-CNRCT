/**
 * Wrapper pour onSnapshot qui attend l'authentification Firebase avant d'activer les listeners.
 * Cela élimine les erreurs "Missing or insufficient permissions" au chargement initial.
 */

import {
    onSnapshot as firestoreOnSnapshot,
    type Query,
    type DocumentReference,
    type FirestoreError,
    type Unsubscribe,
    type DocumentData
} from 'firebase/firestore';

// Promise qui se résout quand l'état d'authentification est déterminé
let authReadyResolve: (() => void) | null = null;
let authReady: Promise<void> | null = null;
let authListenerInitialized = false;

/**
 * Initialise le listener d'authentification de manière lazy (au premier appel)
 */
function ensureAuthListener() {
    if (authListenerInitialized) {
        return;
    }

    authListenerInitialized = true;

    // Créer la Promise maintenant
    authReady = new Promise<void>((resolve) => {
        authReadyResolve = resolve;
    });

    // Importer dynamiquement pour éviter les problèmes d'initialisation
    import('@/lib/firebase').then(({ auth }) => {
        // Utiliser l'import dynamique de onAuthStateChanged aussi
        import('firebase/auth').then(({ onAuthStateChanged }) => {
            try {
                onAuthStateChanged(auth, () => {
                    // Que l'utilisateur soit connecté ou non, l'auth est considérée comme prête
                    if (authReadyResolve) {
                        authReadyResolve();
                        authReadyResolve = null;
                    }
                });
            } catch (error) {
                console.warn('[firestore-wrapper] Could not initialize auth listener:', error);
                // Résoudre quand même pour ne pas bloquer les listeners
                if (authReadyResolve) {
                    authReadyResolve();
                    authReadyResolve = null;
                }
            }
        });
    }).catch((error) => {
        console.error('[firestore-wrapper] Error importing firebase:', error);
        // Résoudre pour ne pas bloquer
        if (authReadyResolve) {
            authReadyResolve();
            authReadyResolve = null;
        }
    });
}

/**
 * Version de onSnapshot qui attend que l'authentification soit prête avant d'activer le listener.
 * Compatible avec toutes les signatures de onSnapshot.
 */
export function onSnapshot<AppModelType = DocumentData, DbModelType extends DocumentData = DocumentData>(
    reference: Query<AppModelType, DbModelType> | DocumentReference<AppModelType, DbModelType>,
    onNext: (snapshot: any) => void,
    onError?: (error: FirestoreError) => void,
    onCompletion?: () => void
): Unsubscribe {
    let unsubscribe: Unsubscribe | null = null;
    let isUnsubscribed = false;
    let isInternallyCleaningUp = false;

    // Initialiser le listener d'auth au premier appel si nécessaire
    ensureAuthListener();

    // Attendre que l'auth soit prête, puis activer le listener
    if (authReady) {
        authReady.then(() => {
            if (!isUnsubscribed) {
                try {
                    // Cast to any pour éviter les conflits de type - le runtime Firebase gère correctement les deux types
                    if (onError !== undefined) {
                        unsubscribe = firestoreOnSnapshot(
                            reference as any,
                            onNext as any,
                            (error) => {
                                if (!isUnsubscribed) onError(error);
                            },
                            onCompletion as any
                        );
                    } else {
                        unsubscribe = firestoreOnSnapshot(
                            reference as any,
                            onNext as any
                        );
                    }

                    // Si on a été désabonné entre temps, appeler immédiatement l'unsubscribe
                    if (isUnsubscribed && unsubscribe) {
                        const subToClean = unsubscribe;
                        unsubscribe = null;
                        subToClean();
                    }
                } catch (error) {
                    console.error('[firestore-wrapper] Error during firestoreOnSnapshot:', error);
                    if (onError) onError(error as any);
                }
            }
        }).catch((error) => {
            console.error('[onSnapshot] Error waiting for auth:', error);
            if (onError) onError(error as any);
        });
    }

    // Retourner une fonction d'unsubscribe qui fonctionne même si le listener n'est pas encore activé
    return () => {
        if (isUnsubscribed) return;
        isUnsubscribed = true;

        if (unsubscribe) {
            const currentUnsubscribe = unsubscribe;
            unsubscribe = null; // Prevent double-unsubscribe
            try {
                currentUnsubscribe();
            } catch (error) {
                console.warn('[firestore-wrapper] Error during unsubscribe:', error);
            }
        }
    };
}

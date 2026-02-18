/**
 * Wrapper utilitaire pour onSnapshot qui gère gracieusement les erreurs de permissions
 * pendant la phase d'authentification initiale.
 */

import { onSnapshot, type Query, type DocumentReference, type QuerySnapshot, type DocumentSnapshot, type FirestoreError } from 'firebase/firestore';

/**
 * Version améliorée de onSnapshot qui supprime les erreurs de permissions en console
 * pendant la phase d'authentification initiale (premières secondes après le chargement).
 */
export function onSnapshotWithAuth<T>(
    reference: Query<T> | DocumentReference<T>,
    onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void,
    onError?: (error: FirestoreError) => void
) {
    const isInitialLoad = Date.now() - (globalThis as any).__appStartTime < 5000; // 5 secondes après le démarrage

    return onSnapshot(
        reference as any,
        onNext as any,
        (error: FirestoreError) => {
            // Pendant le chargement initial, ignorer silencieusement les erreurs de permissions
            if (isInitialLoad && error.code === 'permission-denied') {
                // Erreur attendue pendant l'authentification - ne rien faire
                return;
            }

            // Pour toutes les autres erreurs, ou après le chargement initial, appeler le gestionnaire
            if (onError) {
                onError(error);
            } else {
                // Si pas de gestionnaire fourni, logger uniquement en warning
                console.warn('[Firestore] Error:', error.code, error.message);
            }
        }
    );
}

// Enregistrer le temps de démarrage de l'application
if (typeof window !== 'undefined' && !(globalThis as any).__appStartTime) {
    (globalThis as any).__appStartTime = Date.now();
}

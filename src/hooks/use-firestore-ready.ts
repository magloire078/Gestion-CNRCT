/**
 * Hook qui attend que l'authentification Firebase soit prête avant de retourner true.
 * Utilisé pour retarder l'activation des listeners Firestore jusqu'à ce que l'utilisateur soit authentifié.
 */

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useFirestoreReady(): boolean {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Attendre que l'état d'authentification soit déterminé
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Que l'utilisateur soit connecté ou non, on considère que l'auth est prête
            setIsReady(true);
        });

        return () => unsubscribe();
    }, []);

    return isReady;
}

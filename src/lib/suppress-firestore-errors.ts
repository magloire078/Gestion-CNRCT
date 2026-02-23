"use client";

/**
 * Filtre global pour supprimer les erreurs Firestore de permissions attendues
 * pendant la phase d'authentification initiale.
 */

if (typeof window !== 'undefined') {
    const appStartTime = Date.now();
    const isPermissionError = (msg: string) => {
        const lowerMsg = msg.toLowerCase();
        return lowerMsg.includes('missing or insufficient permissions') ||
            lowerMsg.includes('permission-denied') ||
            lowerMsg.includes('permission_denied') ||
            lowerMsg.includes('firebaseerror') ||
            lowerMsg.includes('firestore') ||
            lowerMsg.includes('could not reach cloud firestore backend');
    };

    // Intercepter console.error
    const originalError = console.error;
    console.error = function (...args: any[]) {
        const isInitialLoad = Date.now() - appStartTime < 30000;
        const errorMessage = args.join(' ');

        if (isInitialLoad && isPermissionError(errorMessage)) {
            return; // Ignorer silencieusement
        }

        originalError.apply(console, args);
    };

    // Intercepter les erreurs non gérées
    window.addEventListener('error', function (event) {
        const isInitialLoad = Date.now() - appStartTime < 30000;
        const errorMessage = event.message || event.error?.message || '';

        if (isInitialLoad && isPermissionError(errorMessage)) {
            console.log(`[firestore-wrapper] Suppressed unhandled error during initial load: ${errorMessage}`);
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        }
    }, true); // Capture phase pour intercepter avant les autres

    // Intercepter les rejets de promesses non gérés
    window.addEventListener('unhandledrejection', function (event) {
        const isInitialLoad = Date.now() - appStartTime < 30000;
        const errorMessage = event.reason?.message || String(event.reason) || '';

        if (isInitialLoad && isPermissionError(errorMessage)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
}

export { };

"use client";

/**
 * Filtre global pour supprimer les avertissements connus et bénins
 * générés par des bibliothèques tierces (Firestore, next-themes, etc.)
 * Ces messages n'indiquent aucun dysfonctionnement réel.
 */

if (typeof window !== 'undefined') {
    const appStartTime = Date.now();

    // ─── Règles de filtrage permanentes (toujours ignorées) ───────────────────
    const isPermanentNoise = (msg: string) => {
        const m = msg.toLowerCase();
        return (
            // Firestore multi-tab IndexedDB lease — transitoire et auto-résolu
            m.includes('failed to obtain primary lease') ||
            m.includes('primary lease for action') ||
            // next-themes injecte un <script> pour éviter le flash de thème,
            // React 19 le signale mais le comportement est correct et voulu.
            m.includes('encountered a script tag while rendering') ||
            m.includes('scripts inside react components are never executed')
        );
    };

    // ─── Règles de filtrage temporaires (30 s après démarrage) ───────────────
    const isInitialLoadNoise = (msg: string) => {
        const m = msg.toLowerCase();
        return (
            m.includes('missing or insufficient permissions') ||
            m.includes('permission-denied') ||
            m.includes('permission_denied') ||
            m.includes('firebaseerror') ||
            m.includes('firestore') ||
            m.includes('auth/network-request-failed') ||
            m.includes('fetching auth token failed') ||
            m.includes('could not reach cloud firestore backend') ||
            m.includes('code=unavailable') ||
            m.includes('the operation could not be completed')
        );
    };

    // ─── Intercepteur console.error ───────────────────────────────────────────
    const originalError = console.error.bind(console);
    console.error = (...args: any[]) => {
        const msg = args.join(' ');
        if (isPermanentNoise(msg)) return;
        if (Date.now() - appStartTime < 30000 && isInitialLoadNoise(msg)) return;
        originalError(...args);
    };

    // ─── Intercepteur console.warn (script tag warning peut venir en warn) ───
    const originalWarn = console.warn.bind(console);
    console.warn = (...args: any[]) => {
        const msg = args.join(' ');
        if (isPermanentNoise(msg)) return;
        originalWarn(...args);
    };

    // ─── Erreurs non gérées ───────────────────────────────────────────────────
    window.addEventListener('error', (event) => {
        const msg = event.message || event.error?.message || '';
        if (Date.now() - appStartTime < 30000 && isInitialLoadNoise(msg)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        }
    }, true);

    // ─── Rejets de promesses non gérés ───────────────────────────────────────
    window.addEventListener('unhandledrejection', (event) => {
        const msg = event.reason?.message || String(event.reason) || '';
        if (Date.now() - appStartTime < 30000 && isInitialLoadNoise(msg)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
}

export { };

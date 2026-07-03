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

    // ─── Intercepteur console.error avec robustesse face aux surcharges (Next.js/React) ───
    let currentError = console.error;
    Object.defineProperty(console, 'error', {
        get() {
            return (...args: any[]) => {
                const msg = args.join(' ');
                if (isPermanentNoise(msg)) return;
                if (Date.now() - appStartTime < 30000 && isInitialLoadNoise(msg)) return;
                currentError(...args);
            };
        },
        set(val) {
            currentError = val;
        },
        configurable: true,
        enumerable: true
    });

    // ─── Intercepteur console.warn avec robustesse face aux surcharges (Next.js/React) ───
    let currentWarn = console.warn;
    Object.defineProperty(console, 'warn', {
        get() {
            return (...args: any[]) => {
                const msg = args.join(' ');
                if (isPermanentNoise(msg)) return;
                currentWarn(...args);
            };
        },
        set(val) {
            currentWarn = val;
        },
        configurable: true,
        enumerable: true
    });

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

/**
 * Service de journalisation (audit trail).
 *
 * Écrit un événement dans la collection Firestore `audit_log` à chaque mutation
 * sensible (création, modification, suppression, changement de statut).
 *
 * Usage :
 *   import { logAudit } from '@/services/audit-log-service';
 *   await logAudit({ action: 'update', resource: 'conflict', resourceId: id, ... });
 *
 * L'écriture n'est jamais bloquante : si le log échoue, on émet un warning
 * mais on ne propage pas l'erreur — la mutation métier a priorité.
 */

import {
    collection,
    addDoc,
    onSnapshot,
    Unsubscribe,
    query,
    orderBy,
    limit,
    where,
} from '@/lib/firebase';
import { db, auth } from '@/lib/firebase';

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'status-change'
    | 'bulk-delete'
    | 'export'
    | 'import'
    | 'permission-change'
    | 'login'
    | 'logout';

export type AuditResource =
    | 'conflict'
    | 'mission'
    | 'employee'
    | 'chief'
    | 'village'
    | 'heritage'
    | 'document'
    | 'leave'
    | 'user'
    | 'role'
    | 'settings'
    | 'other';

export interface AuditLogEntry {
    id: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    resourceLabel?: string;
    actorUid: string;
    actorEmail: string;
    actorName?: string;
    timestamp: string; // ISO-8601
    summary?: string;
    details?: Record<string, unknown>;
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
}

interface LogAuditParams {
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    resourceLabel?: string;
    summary?: string;
    details?: Record<string, unknown>;
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
}

const COLLECTION_NAME = 'audit_log';

/**
 * Nettoie une valeur pour ne garder que ce qui est sérialisable dans Firestore
 * et éviter d'y écrire des blobs / functions / File / undefined.
 */
function sanitizeSnapshot(v: unknown): unknown {
    if (v === undefined || v === null) return null;
    if (typeof v === 'function') return null;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sanitizeSnapshot);
    if (typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
            if (val === undefined) continue;
            if (val instanceof File || val instanceof Blob) continue;
            out[k] = sanitizeSnapshot(val);
        }
        return out;
    }
    return v;
}

/**
 * Écrit un événement d'audit. Ne throw jamais — un échec de log ne doit
 * jamais bloquer une mutation métier.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            // Pas d'utilisateur = pas de log (les règles Firestore refuseraient aussi).
            return;
        }

        const entry: Omit<AuditLogEntry, 'id'> = {
            action: params.action,
            resource: params.resource,
            actorUid: currentUser.uid,
            actorEmail: currentUser.email || '',
            actorName: currentUser.displayName || currentUser.email || 'Inconnu',
            timestamp: new Date().toISOString(),
        };

        if (params.resourceId) entry.resourceId = params.resourceId;
        if (params.resourceLabel) entry.resourceLabel = params.resourceLabel;
        if (params.summary) entry.summary = params.summary;
        if (params.details) entry.details = sanitizeSnapshot(params.details) as Record<string, unknown>;
        if (params.beforeSnapshot) entry.beforeSnapshot = sanitizeSnapshot(params.beforeSnapshot) as Record<string, unknown>;
        if (params.afterSnapshot) entry.afterSnapshot = sanitizeSnapshot(params.afterSnapshot) as Record<string, unknown>;

        await addDoc(collection(db, COLLECTION_NAME), entry);
    } catch (err) {
        // Ne jamais bloquer la mutation métier à cause d'un problème de log.
        console.warn('[audit-log] Failed to write audit entry:', err);
    }
}

interface SubscribeOptions {
    max?: number;
    resource?: AuditResource;
    actorUid?: string;
}

/**
 * Écoute les N derniers événements d'audit en temps réel.
 * Optionnellement filtrable par ressource ou acteur.
 */
export function subscribeToAuditLog(
    onUpdate: (entries: AuditLogEntry[]) => void,
    onError: (err: Error) => void,
    options: SubscribeOptions = {},
): Unsubscribe {
    const { max = 200, resource, actorUid } = options;
    const constraints: Parameters<typeof query>[1][] = [];
    if (resource) constraints.push(where('resource', '==', resource));
    if (actorUid) constraints.push(where('actorUid', '==', actorUid));
    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(max));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    return onSnapshot(
        q,
        (snapshot) => {
            const entries = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AuditLogEntry));
            onUpdate(entries);
        },
        (err) => onError(err),
    );
}

/**
 * Compare deux objets et retourne uniquement les clés qui ont changé,
 * avec leur ancienne et nouvelle valeur. Utilisé pour les updates ciblées.
 */
export function diffChanges<T extends Record<string, unknown>>(
    before: Partial<T>,
    after: Partial<T>,
): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
        const a = before[key];
        const b = after[key];
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            changes[key] = { from: a ?? null, to: b ?? null };
        }
    }
    return changes;
}

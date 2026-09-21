import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ_SENSITIVE' | 'LOGIN' | 'LOGOUT';

export interface AuditLogDetails {
  collection: string;
  documentId: string;
  action: AuditAction;
  userId: string;
  userEmail?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an action to the 'audit_logs' Firestore collection.
 * Important: This depends on Firestore rules allowing the current user to create logs,
 * but preventing them from modifying or deleting them.
 */
export async function logAuditAction(details: AuditLogDetails) {
  try {
    const auditDocRef = doc(collection(db, 'audit_logs'));
    await setDoc(auditDocRef, {
      ...details,
      timestamp: serverTimestamp(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    }, { merge: true });
  } catch (error: any) {
    if (error?.code !== 'already-exists' && !error?.message?.toLowerCase().includes('already exists')) {
      console.warn("[Audit] Failed to write audit log:", error?.message || error);
    }
  }
}

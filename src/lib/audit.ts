import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const auditRef = collection(db, 'audit_logs');
    await addDoc(auditRef, {
      ...details,
      timestamp: serverTimestamp(),
      // In a pure client-side setup, getting IP/UserAgent is tricky to enforce securely,
      // but we can add basic browser info if needed.
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    });
    console.log(`[Audit] Logged ${details.action} on ${details.collection}/${details.documentId}`);
  } catch (error) {
    console.error("[Audit] Failed to write audit log:", error);
    // Depending on security requirements, you might want to throw the error
    // to prevent the original action if the audit log fails.
    // For now, we just log it to console to not break the app entirely.
  }
}

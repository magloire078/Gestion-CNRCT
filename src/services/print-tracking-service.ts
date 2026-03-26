
"use client";

import { db, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from '@/lib/firebase';
import type { PrintLog } from '@/lib/data';

const COLLECTION_NAME = 'print_logs';

/**
 * Enregistre une action d'impression ou d'export PDF dans Firestore.
 */
export async function logPrintAction(logData: Omit<PrintLog, 'id' | 'timestamp'>): Promise<void> {
    try {
        const logsRef = collection(db, COLLECTION_NAME);
        await addDoc(logsRef, {
            ...logData,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("[PrintTrackingService] Failed to log print action:", error);
    }
}

/**
 * Récupère le nombre total de bulletins imprimés pour une période donnée (MM-YYYY).
 */
export async function getPrintStatsForPeriod(period: string): Promise<{ total: number, print: number, pdf: number }> {
    try {
        const logsRef = collection(db, COLLECTION_NAME);
        const q = query(logsRef, where('period', '==', period));
        const querySnapshot = await getDocs(q);
        
        let stats = { total: 0, print: 0, pdf: 0 };
        
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PrintLog;
            stats.total += data.count;
            if (data.actionType === 'print') stats.print += data.count;
            if (data.actionType === 'pdf') stats.pdf += data.count;
        });
        
        return stats;
    } catch (error) {
        console.error("[PrintTrackingService] Failed to fetch print stats:", error);
        return { total: 0, print: 0, pdf: 0 };
    }
}

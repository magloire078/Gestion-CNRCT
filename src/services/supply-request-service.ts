import { db } from '@/lib/firebase';
import { 
    collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, 
    doc, updateDoc, where, getDocs, getDoc, serverTimestamp, 
    type DocumentData, type QueryDocumentSnapshot 
} from '@/lib/firebase';
import type { SupplyRequest, SupplyRequestStatus, SupplyRequestItem } from '@/types/supply';
import { createNotification } from './notification-service';
import { logSupplyTransaction } from './supply-service';

const requestCollection = collection(db, 'supply_requests');

/**
 * Submits a new product request from an employee.
 */
export async function createSupplyRequest(requestData: Omit<SupplyRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newRequest = {
        ...requestData,
        status: 'Pending_Supervisor', // Initial status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(requestCollection, newRequest);
    
    // Notify administrators/managers
    await createNotification({
        userId: 'manager', // Or any logic to find relevant admins
        title: 'Nouvelle Demande de Fournitures',
        description: `${requestData.employeeName} a soumis une demande pour ${requestData.items.length} article(s).`,
        href: '/management'
    });
    
    return docRef.id;
}

/**
 * Subscribes to supply requests with optional filtering.
 */
export function subscribeToSupplyRequests(
    filters: { status?: SupplyRequestStatus; employeeId?: string } = {},
    callback: (requests: SupplyRequest[]) => void
): Unsubscribe {
    let q = query(requestCollection, orderBy("createdAt", "desc"));
    
    if (filters.status) {
        q = query(q, where("status", "==", filters.status));
    }
    
    if (filters.employeeId) {
        q = query(q, where("employeeId", "==", filters.employeeId));
    }
    
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        } as SupplyRequest));
        callback(requests);
    });
}

/**
 * Validates a request by a supervisor.
 */
export async function validateBySupervisor(
    requestId: string, 
    supervisorId: string, 
    supervisorName: string, 
    comment?: string
): Promise<void> {
    const requestRef = doc(requestCollection, requestId);
    await updateDoc(requestRef, {
        status: 'Pending_Stock',
        supervisorId,
        supervisorName,
        supervisorComment: comment || "",
        validatedBySupervisorAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    // Notify stock managers
    await createNotification({
        userId: 'inventory_manager',
        title: 'Demande Validée par Supérieur',
        description: `Une demande est prête pour livraison.`,
        href: '/supplies'
    });
}

/**
 * Rejects a request.
 */
export async function rejectRequest(
    requestId: string,
    reason: string,
    rejectedBy: string
): Promise<void> {
    const requestRef = doc(requestCollection, requestId);
    const requestSnap = await getDoc(requestRef);
    const requestData = requestSnap.data() as SupplyRequest;

    await updateDoc(requestRef, {
        status: 'Rejected',
        rejectionReason: reason,
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    // Notify employee
    await createNotification({
        userId: requestData.employeeId,
        title: 'Demande de Fournitures Rejetée',
        description: `Votre demande a été refusée pour le motif suivant : ${reason}`,
        href: '/profile'
    });
}

/**
 * Fulfills a request (Stock Manager).
 * This marks the request as served and decrements inventory for each item.
 */
export async function fulfillSupplyRequest(
    requestId: string,
    stockManagerId: string,
    stockManagerName: string
): Promise<void> {
    const requestRef = doc(requestCollection, requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) throw new Error("Request not found");
    
    const requestData = requestSnap.data() as SupplyRequest;
    
    // 1. Process inventory for each item
    for (const item of requestData.items) {
        await logSupplyTransaction({
            supplyId: item.supplyId,
            supplyName: item.supplyName,
            recipientId: requestData.employeeId,
            recipientName: requestData.employeeName,
            quantity: item.quantity,
            date: new Date().toISOString().split('T')[0],
            type: 'distribution',
            performedBy: stockManagerId
        }, true); // Important: updateQuantity = true
    }
    
    // 2. Mark request as served
    await updateDoc(requestRef, {
        status: 'Served',
        stockManagerId,
        stockManagerName,
        servedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    // 3. Notify employee
    await createNotification({
        userId: requestData.employeeId,
        title: 'Fournitures Livrées',
        description: `Votre demande a été servie. Vous pouvez récupérer vos articles.`,
        href: '/profile'
    });
}

/**
 * Fetches all requests by status (non-subscription).
 */
export async function getRequestsByStatus(status: SupplyRequestStatus): Promise<SupplyRequest[]> {
    const q = query(requestCollection, where("status", "==", status), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
}

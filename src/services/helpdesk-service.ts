

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, where, getDocs, Timestamp } from '@/lib/firebase';
import type { Ticket, TicketMessage, TicketStatus } from '@/lib/data';
import { createNotification } from './notification-service';


const ticketsCollection = collection(db, 'tickets');

export function subscribeToTickets(
    callback: (tickets: Ticket[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(ticketsCollection, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Ticket));
            callback(tickets);
        },
        (error) => {
            console.error("Error subscribing to tickets:", error);
            onError(error);
        }
    );
    return unsubscribe;
}


export async function getTicket(id: string): Promise<Ticket | null> {
    const docRef = doc(db, 'tickets', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Ticket;
    }
    return null;
}

export function subscribeToTicketMessages(
    ticketId: string,
    callback: (messages: TicketMessage[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const messagesCollection = collection(db, `tickets/${ticketId}/messages`);
    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TicketMessage));
            callback(messages);
        },
        (error) => {
            console.error(`Error subscribing to messages for ticket ${ticketId}:`, error);
            onError(error);
        }
    );
    return unsubscribe;
}


export async function addTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Ticket> {
    const now = new Date().toISOString();
    const newTicketData = {
        ...ticketData,
        status: 'Ouvert' as TicketStatus,
        createdAt: now,
        updatedAt: now,
    };
    const docRef = await addDoc(ticketsCollection, newTicketData);
    
    // Notify helpdesk agents
    await createNotification({
        userId: 'manager', // This special ID targets roles like admin/manager
        title: `Nouveau Ticket: ${ticketData.title}`,
        description: `Un nouveau ticket a été créé par ${ticketData.createdByName}.`,
        href: `/helpdesk/${docRef.id}`
    });

    return { id: docRef.id, ...newTicketData };
}

export async function addMessageToTicket(ticketId: string, messageData: Omit<TicketMessage, 'id' | 'createdAt' | 'ticketId'>): Promise<TicketMessage> {
    const messagesCollection = collection(db, `tickets/${ticketId}/messages`);
    const now = new Date().toISOString();
    
    const newMessageData = {
        ...messageData,
        ticketId,
        createdAt: now,
    };
    
    const docRef = await addDoc(messagesCollection, newMessageData);

    // Update the ticket's updatedAt timestamp
    const ticketDocRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketDocRef, { updatedAt: now });

    // Send notification
    const ticket = await getTicket(ticketId);
    if (ticket) {
        // If the author is the creator of the ticket, notify the assigned agent (or all agents)
        if (messageData.authorId === ticket.createdBy) {
             await createNotification({
                userId: ticket.assignedTo || 'manager', 
                title: `Réponse sur le ticket #${ticketId}`,
                description: `${ticket.createdByName} a répondu sur le ticket "${ticket.title}".`,
                href: `/helpdesk/${ticketId}`
            });
        } 
        // If the author is not the creator (i.e., an agent), notify the original user
        else {
             await createNotification({
                userId: ticket.createdBy,
                title: `Nouvelle réponse sur votre ticket`,
                description: `${messageData.authorName} a répondu à votre ticket "${ticket.title}".`,
                href: `/helpdesk/${ticketId}`
            });
        }
    }


    return { id: docRef.id, ...newMessageData };
}

export async function updateTicket(ticketId: string, dataToUpdate: Partial<Ticket>): Promise<void> {
    const ticketDocRef = doc(db, 'tickets', ticketId);
    const updatePayload = { ...dataToUpdate, updatedAt: new Date().toISOString() };
    await updateDoc(ticketDocRef, updatePayload);
}



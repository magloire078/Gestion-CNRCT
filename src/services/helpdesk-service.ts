

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, where, getDocs, Timestamp } from '@/lib/firebase';
import type { Ticket, TicketMessage, TicketStatus } from '@/lib/data';
import { createNotification } from './notification-service';


const ticketsCollection = collection(db, 'tickets');

export function subscribeToTickets(
    callback: (tickets: Ticket[]) => void,
    onError: (error: Error) => void,
    userId?: string
): Unsubscribe {
    let q = query(ticketsCollection, orderBy("createdAt", "desc"));
    if (userId) {
        q = query(ticketsCollection, where("createdBy", "==", userId), orderBy("createdAt", "desc"));
    }
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const tickets = snapshot.docs.map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    messages: [], // Ensure mandatory array is initialized
                    ...data,
                    // If these are Firestore Timestamps, convert them to ISO strings
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                } as unknown as Ticket;
            });
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
        const data = docSnap.data();
        return { 
            id: docSnap.id, 
            messages: [], // Ensure mandatory array is initialized
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Ticket;
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
            const messages = snapshot.docs.map((doc: any) => ({
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
    
    // Priority assignment logic (GLPI style: Impact x Urgency)
    // For now, we take the provided priority if it exists, otherwise Default to Basse
    
    const newTicketData = {
        ...ticketData,
        status: 'Ouvert' as TicketStatus,
        createdAt: now,
        updatedAt: now,
    };
    const docRef = await addDoc(ticketsCollection, newTicketData);
    
    // Notify helpdesk agents
    await createNotification({
        userId: 'manager', 
        title: `Nouveau Ticket #${docRef.id.slice(0, 5)}: ${ticketData.title}`,
        description: `Un nouveau ticket [${ticketData.category}] a été créé par ${ticketData.createdByName}.`,
        href: `/helpdesk/${docRef.id}`
    });

    return { id: docRef.id, ...newTicketData } as Ticket;
}

export async function resolveTicket(ticketId: string, solution: string, agentName: string): Promise<void> {
    const now = new Date().toISOString();
    const ticketDocRef = doc(db, 'tickets', ticketId);
    
    await updateDoc(ticketDocRef, {
        status: 'Résolu',
        solution,
        updatedAt: now
    });

    const ticket = await getTicket(ticketId);
    if (ticket) {
        await createNotification({
            userId: ticket.createdBy,
            title: `Ticket Résolu #${ticketId.slice(0, 5)}`,
            description: `${agentName} a apporté une solution à votre ticket : "${ticket.title}".`,
            href: `/helpdesk/${ticketId}`
        });
    }
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

    // If assignedTo changed, notify the agent
    if (dataToUpdate.assignedTo) {
        await createNotification({
            userId: dataToUpdate.assignedTo,
            title: `Nouveau ticket attribué`,
            description: `Le ticket #${ticketId.slice(0, 5)} vous a été attribué.`,
            href: `/helpdesk/${ticketId}`
        });
    }
}



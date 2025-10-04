

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Service } from '@/lib/data';
import { db } from '@/lib/firebase';

const servicesCollection = collection(db, 'services');

export function subscribeToServices(
    callback: (services: Service[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(servicesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const services = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Service));
            callback(services);
        },
        (error) => {
            console.error("Error subscribing to services:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getServices(): Promise<Service[]> {
  const q = query(servicesCollection, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Service));
}

export async function addService(serviceData: Omit<Service, 'id'>): Promise<Service> {
    const docRef = await addDoc(servicesCollection, serviceData);
    return { id: docRef.id, ...serviceData };
}

export async function updateService(serviceId: string, serviceData: Partial<Service>): Promise<void> {
    const serviceDocRef = doc(db, 'services', serviceId);
    await updateDoc(serviceDocRef, serviceData);
}

export async function deleteService(serviceId: string): Promise<void> {
    const serviceDocRef = doc(db, 'services', serviceId);
    await deleteDoc(serviceDocRef);
}

    

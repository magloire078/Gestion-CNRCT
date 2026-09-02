import { 
  addDoc as firestoreAddDoc,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  DocumentReference,
  CollectionReference,
  UpdateData,
  WithFieldValue,
  SetOptions
} from 'firebase/firestore';
import { logAuditAction } from './audit';
import { auth } from './firebase-init';

function extractInfoFromRef(ref: DocumentReference<any, any> | CollectionReference<any, any>) {
  const path = ref.path;
  const parts = path.split('/');
  if (parts.length % 2 === 0) {
    // Document
    return { collection: parts[0], documentId: parts[parts.length - 1] };
  } else {
    // Collection
    return { collection: parts[0], documentId: 'new_doc' };
  }
}

export async function addDoc<T, D>(reference: CollectionReference<T, D>, data: WithFieldValue<T>) {
  const result = await firestoreAddDoc(reference, data);
  const info = extractInfoFromRef(reference);
  const user = auth.currentUser;
  
  if (user && info.collection !== 'audit_logs') {
    logAuditAction({
      collection: info.collection,
      documentId: result.id,
      action: 'CREATE',
      userId: user.uid,
      userEmail: user.email || undefined,
    }).catch(console.error);
  }
  return result;
}

export async function setDoc<T, D>(reference: DocumentReference<T, D>, data: WithFieldValue<T>, options?: SetOptions) {
  const result = options ? await firestoreSetDoc(reference, data, options) : await firestoreSetDoc(reference, data);
  const info = extractInfoFromRef(reference);
  const user = auth.currentUser;
  
  if (user && info.collection !== 'audit_logs') {
    logAuditAction({
      collection: info.collection,
      documentId: info.documentId,
      action: options?.merge ? 'UPDATE' : 'CREATE',
      userId: user.uid,
      userEmail: user.email || undefined,
    }).catch(console.error);
  }
  return result;
}

export async function updateDoc<T, D>(reference: DocumentReference<T, D>, data: UpdateData<D>) {
  const result = await firestoreUpdateDoc(reference, data as any);
  const info = extractInfoFromRef(reference);
  const user = auth.currentUser;
  
  if (user && info.collection !== 'audit_logs') {
    logAuditAction({
      collection: info.collection,
      documentId: info.documentId,
      action: 'UPDATE',
      userId: user.uid,
      userEmail: user.email || undefined,
    }).catch(console.error);
  }
  return result;
}

export async function deleteDoc<T, D>(reference: DocumentReference<T, D>) {
  const result = await firestoreDeleteDoc(reference);
  const info = extractInfoFromRef(reference);
  const user = auth.currentUser;
  
  if (user && info.collection !== 'audit_logs') {
    logAuditAction({
      collection: info.collection,
      documentId: info.documentId,
      action: 'DELETE',
      userId: user.uid,
      userEmail: user.email || undefined,
    }).catch(console.error);
  }
  return result;
}

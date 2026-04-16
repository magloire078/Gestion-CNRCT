
import { app, db, auth, storage, isConfigValid, config } from './firebase-init';
import { getAnalytics } from "firebase/analytics";

// Initialize Analytics lazily
if (isConfigValid && typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (error) {
    // Silently fail analytics
  }
}

if (typeof window !== 'undefined') {
  if (isConfigValid) {
    console.log(`[Firebase] Active Project: ${config.projectId}`);
  } else {
    console.warn("[Firebase] Running with DUMMY config. Check .env.local variables.");
  }
}

export { app, db, auth, storage, isConfigValid };

// Export the wrapped onSnapshot that waits for Auth
export { onSnapshot } from './firestore-wrapper';

// Re-export Firestore functions for services
export {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  type DocumentData,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type Unsubscribe,
  type FirestoreError,
  type DocumentSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  or,
  and,
} from 'firebase/firestore';

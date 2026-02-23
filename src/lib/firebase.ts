
if (typeof window === 'undefined') {
  // Polyfill for localStorage on the server to avoid error: localStorage.getItem is not a function
  (global as any).localStorage = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => { },
    removeItem: (key: string) => { },
    clear: () => { },
    length: 0,
    key: (index: number) => null,
  };
}

import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';


// Initialize Firebase

// Provide a dummy config during build if real config is missing
// This prevents crashes in services that call doc(db, ...) at module level
const finalConfig = isConfigValid ? firebaseConfig : {
  apiKey: "dummy-api-key",
  authDomain: "dummy.firebaseapp.com",
  projectId: "gestion-cnrct-dummy", // Must be a valid format
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000000000:web:000000000"
};

const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

if (isConfigValid && typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (error) {
    console.log("Could not initialize Analytics", error);
  }
}

const CONFIG_VERSION = "v2.1";

if (!isConfigValid) {
  if (typeof window !== 'undefined') {
    console.error(`[Firebase ${CONFIG_VERSION}] CRITICAL: Configuration is missing!`);

    // Explicitly listing missing ones for the user to see in their console
    const debugInfo = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Missing",
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Missing",
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Missing",
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Set" : "Missing",
    };

    console.table(debugInfo);
    console.error("Check Vercel Settings > Environment Variables. Names MUST start with NEXT_PUBLIC_");
  } else {
    console.warn(`[Firebase ${CONFIG_VERSION}] Missing config. Using dummy for build.`);
  }
}

export { app, db, auth, storage, isConfigValid };

// Exporter le wrapper onSnapshot qui attend l'authentification
export { onSnapshot } from './firestore-wrapper';

// Ré-exporter les autres fonctions Firestore dont les services ont besoin
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
} from 'firebase/firestore';



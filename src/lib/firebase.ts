
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, Firestore } from "firebase/firestore";
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern to initialize Firebase services
function initializeServices() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    const db: Firestore = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });

    const auth: Auth = getAuth(app);
    const storage: FirebaseStorage = getStorage(app);
    
    if (typeof window !== 'undefined') {
        getAnalytics(app);
    }

    return { app, db, auth, storage };
}

const { app, db, auth, storage } = initializeServices();

export { app, db, auth, storage };

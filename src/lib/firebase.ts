
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.API_KEY || "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  databaseURL: "https://gestion-cnrct-default-rtdb.firebaseio.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a",
  measurementId: "G-TDXM581DZ5"
};

// Singleton pattern to initialize Firebase services
function initializeServices() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Use initializeFirestore with memory cache to avoid persistence issues in SSR environments
    // This is the correct way to handle Firestore in Next.js App Router for server components.
    const db: Firestore = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });

    const auth: Auth = getAuth(app);
    const storage: FirebaseStorage = getStorage(app);
    
    // Initialize Analytics if not in a server environment
    if (typeof window !== 'undefined') {
        getAnalytics(app);
    }

    return { app, db, auth, storage };
}

const { app, db, auth, storage } = initializeServices();

export { app, db, auth, storage };

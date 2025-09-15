
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore, memoryLocalCache, Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "project-126727792063",
  storageBucket: "gestion-cnrct.firebasestorage.app",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a"
};

// Singleton pattern to initialize Firebase services
function initializeServices() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Use initializeFirestore with memory cache to avoid persistence issues in SSR environments
    const db: Firestore = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });

    const auth: Auth = getAuth(app);
    const storage: FirebaseStorage = getStorage(app);

    return { app, db, auth, storage };
}

const { app, db, auth, storage } = initializeServices();

export { app, db, auth, storage };

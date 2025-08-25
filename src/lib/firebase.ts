
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore, memoryLocalCache, Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a"
};

// Singleton pattern to initialize Firebase services
function initializeServices() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    let firestore: Firestore;
    try {
        firestore = getFirestore(app);
    } catch(e) {
        firestore = initializeFirestore(app, {
            localCache: memoryLocalCache(),
        });
    }

    const auth: Auth = getAuth(app);
    const storage: FirebaseStorage = getStorage(app);

    // NOTE: The emulator connection is disabled to use live Firebase services
    // and resolve network issues in the development environment.
    /*
    if (process.env.NODE_ENV === 'development') {
        try {
            connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
            connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
            connectStorageEmulator(storage, '127.0.0.1', 9199);
        } catch (e) {
            console.error("Could not connect to emulators", e);
        }
    }
    */
    
    return { app, db: firestore, auth, storage };
}

const { app, db, auth, storage } = initializeServices();

export { app, db, auth, storage };

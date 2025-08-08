
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a"
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// The app is now configured to use mock data, so we don't initialize Firestore/Auth/Storage.
// To re-enable Firebase, uncomment the lines below and in the individual service files.

// const db = getFirestore(app);
// const auth = getAuth(app);
// const storage = getStorage(app);

// if (process.env.NODE_ENV === 'development') {
//     try {
//       connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
//       connectFirestoreEmulator(db, '127.0.0.1', 8080);
//       connectStorageEmulator(storage, '127.0.0.1', 9199);
//     } catch (e) {
//       console.error("Could not connect to emulators", e);
//     }
// }

// We export dummy objects to avoid breaking the app structure.
const db = {};
const auth = {};
const storage = {};


export { app, db, auth, storage };

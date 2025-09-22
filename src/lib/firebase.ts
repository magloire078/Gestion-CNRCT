
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "gestion-cnrct-w8ljs.firebaseapp.com",
  projectId: "gestion-cnrct-w8ljs",
  storageBucket: "gestion-cnrct-w8ljs.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern to initialize Firebase services
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

if (typeof window !== 'undefined') {
    try {
        getAnalytics(app);
    } catch (error) {
        console.log("Could not initialize Analytics", error);
    }
}

export { app, db, auth, storage };


import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDFf3F9Y8fH4k1qZ1p2jX7s4w8v9yB3a5c",
  authDomain: "gestion-cnrct.firebaseapp.com",
  databaseURL: "https://gestion-cnrct-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-ABC123XYZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
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

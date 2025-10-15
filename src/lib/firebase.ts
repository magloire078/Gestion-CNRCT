
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCilrvsY82p5T9i1sNmRGot0pXq_8iJq8s",
  authDomain: "gestion-cnrct-w8ljs.firebaseapp.com",
  databaseURL: "https://gestion-cnrct-w8ljs-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestion-cnrct-w8ljs",
  storageBucket: "gestion-cnrct-w8ljs.appspot.com",
  messagingSenderId: "333734188554",
  appId: "1:333734188554:web:e0586f1e635c91f1a547b7",
  measurementId: "G-85P0P7EVQ7"
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


import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyB-bYq9fG2c5rX6wT4yZ8xV1w3s5u7o0_E",
  authDomain: "gestion-cnrct.firebaseapp.com",
  databaseURL: "https://gestion-cnrct-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "1009181199450",
  appId: "1:1009181199450:web:41786f036f86745f441585",
  measurementId: "G-9XG4H9X9BE"
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


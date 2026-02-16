
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a",
  measurementId: "G-TDXM581DZ5"
};


// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

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




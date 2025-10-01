
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: "1:126727792063:web:55513c7e21531a87286d0a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Use a function to ensure services are initialized only once
function initializeFirebaseServices() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  // Initialize Analytics only in the browser
  if (typeof window !== 'undefined') {
    try {
      getAnalytics(app);
    } catch (error) {
      console.log("Could not initialize Analytics", error);
    }
  }

  return { app, db, auth, storage };
}

// Export the initialized services
const { app, db, auth, storage } = initializeFirebaseServices();

export { app, db, auth, storage };

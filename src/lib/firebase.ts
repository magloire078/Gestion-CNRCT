
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration from your project settings
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDitYwDJDbuOQ_P-oNYl4frU5f4BwUH7Ts",
  authDomain: "gestion-rh---rm---cnrct.firebaseapp.com",
  projectId: "gestion-rh---rm---cnrct",
  storageBucket: "gestion-rh---rm---cnrct.appspot.com",
  messagingSenderId: "48787881869",
  appId: "1:48787881869:web:a33c62ee0f1844cd1154b6",
  measurementId: "G-SKJM2Y12HT"
};

// Initialize Firebase safely for Next.js
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

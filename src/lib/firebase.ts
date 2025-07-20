
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from your project settings
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDitYwDJDbuOQ_P-oNYl4frU5f4BwUH7Ts",
  authDomain: "gestion-rh---rm---cnrct.firebaseapp.com",
  databaseURL: "https://gestion-rh---rm---cnrct-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestion-rh---rm---cnrct",
  storageBucket: "gestion-rh---rm---cnrct.firebasestorage.app",
  messagingSenderId: "487878818691",
  appId: "1:487878818691:web:a33c62ee0f1844cd1154b6",
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

export { app, db };

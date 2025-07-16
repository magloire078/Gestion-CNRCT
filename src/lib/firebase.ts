
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDitYwDJDbuOQ_P-oNYl4frU5f4BwUH7Ts",
  authDomain: "synergierh.firebaseapp.com",
  projectId: "synergierh",
  storageBucket: "synergierh.appspot.com",
  messagingSenderId: "487878818691",
  appId: "1:487878818691:web:a33c62ee0f1844cd1154b6",
  measurementId: "G-SKJM2Y12HT"
};

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export { app, db };

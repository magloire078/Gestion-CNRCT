
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Function to check if all required environment variables are set
function checkFirebaseConfig(config: FirebaseOptions): boolean {
    const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId'];
    for (const key of requiredKeys) {
        if (!config[key]) {
            console.error(`Firebase config is missing required key: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);
            return false;
        }
    }
    return true;
}


// Initialize Firebase
let app;
if (!getApps().length) {
    if (checkFirebaseConfig(firebaseConfig)) {
        app = initializeApp(firebaseConfig);
    } else {
        console.error("Firebase initialization failed due to missing configuration. Please check your .env file.");
    }
} else {
  app = getApps()[0];
}

// Conditionally initialize db only if app was successfully initialized
const db = app ? getFirestore(app) : null;

if (!db) {
    console.error("Firestore could not be initialized. Make sure your Firebase configuration is correct and the app was initialized successfully.");
}

export { app, db };


import './suppress-firestore-errors';
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Helper to sanitize environment variables that might contain literal quotes
const sanitize = (val: any) => {
  if (typeof val !== 'string') return val;
  return val.replace(/^["'](.*)['"']$/, '$1').trim();
};

const firebaseConfig: FirebaseOptions = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};

const isConfigValid =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.apiKey !== '';

const finalConfig = isConfigValid ? firebaseConfig : {
  apiKey: "dummy-api-key",
  authDomain: "dummy.firebaseapp.com",
  projectId: "gestion-cnrct-dummy",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000000000:web:000000000"
};

// Initialize Firebase App (singleton pattern)
const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();

if (typeof window !== 'undefined' && isConfigValid) {
  // En mode développement, on peut utiliser un token de debug
  if (process.env.NODE_ENV === 'development') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn("Failed to initialize AppCheck", error);
  }
}

// Initialize Firestore with persistent multi-tab cache only on the client
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: typeof window !== 'undefined' 
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : memoryLocalCache(),
    experimentalForceLongPolling: true
  });
} catch (error: any) {
  if (error.code === 'failed-precondition' || (error.message && error.message.includes('initializeFirestore'))) {
    db = getFirestore(app);
  } else {
    throw error;
  }
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, isConfigValid, firebaseConfig as config };

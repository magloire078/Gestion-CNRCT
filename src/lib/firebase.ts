
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";


// ==========================================================================================
// ACTION REQUISE : Mettez à jour votre configuration Firebase ci-dessous.
//
// Accédez à la console Firebase de votre projet :
// 1. Allez sur https://console.firebase.google.com/
// 2. Sélectionnez votre projet "gestion-cnrct".
// 3. Cliquez sur l'icône d'engrenage (⚙️) en haut à gauche et allez dans "Paramètres du projet".
// 4. Faites défiler vers le bas jusqu'à la section "Vos applications".
// 5. Trouvez votre application Web et cliquez sur l'icône </> pour voir le "SDK setup and configuration".
// 6. Sélectionnez "Config" et copiez les valeurs correspondantes ci-dessous.
// ==========================================================================================

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a"
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
const storage = getStorage(app);

// Connect to emulators in development mode
if (process.env.NODE_ENV === 'development') {
    console.log("Mode développement : Connexion aux émulateurs Firebase sur 127.0.0.1...");
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.log("Connecté avec succès aux émulateurs.");
    } catch (e) {
      console.error("Erreur lors de la connexion aux émulateurs Firebase :", e);
    }
}

export { app, db, auth, storage };

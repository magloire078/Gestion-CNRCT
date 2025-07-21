
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  // ✅ REMPLACEZ CECI par la valeur "apiKey" de votre console Firebase.
  apiKey: "YOUR_NEW_API_KEY",

  // Ces valeurs sont généralement correctes si votre ID de projet est "gestion-cnrct".
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",

  // ✅ REMPLACEZ CECI par la valeur "messagingSenderId" de votre console Firebase.
  messagingSenderId: "YOUR_NEW_MESSAGING_SENDER_ID",
  
  // ✅ REMPLACEZ CECI par la valeur "appId" de votre console Firebase.
  appId: "YOUR_NEW_APP_ID",
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

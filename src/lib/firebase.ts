
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

export { app, db, auth };

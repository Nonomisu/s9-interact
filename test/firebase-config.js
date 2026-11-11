// Configuration Firebase de l'appli « S9 Interact' » (projet s9-interact).
// Projet séparé de Journée RP (journal-rp) et d'Iloh Khurdan (khurdans-afc03) : rien ici ne touche ces applis.
// Ces valeurs identifient le projet ; elles ne sont pas secrètes : la sécurité repose sur les règles Firestore.
// SDK chargé par balise <script type="module"> depuis le CDN Google, version proposée par la console :
//   https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js (+ firebase-auth.js, firebase-firestore.js)
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/13.2.0";
// Hébergement : GitHub Pages du compte nonomisu (domaine autorisé dans Firebase Authentication).
export const PAGES_DOMAIN = "nonomisu.github.io";
export const firebaseConfig = {
  apiKey: "AIzaSyDfn3sUmjHcaY1g6JdnJk4qiuMc1aPUlWU",
  authDomain: "s9-interact.firebaseapp.com",
  projectId: "s9-interact",
  storageBucket: "s9-interact.firebasestorage.app",
  messagingSenderId: "684567553102",
  appId: "1:684567553102:web:269deaa1947efafb8f4f1f",
};

// Configuration Firebase de l'appli « S9 Interact' » : projet à créer par Nono (étape 4 du cahier de lancement).
// Projet séparé de Journée RP (journal-rp) et d'Iloh Khurdan (khurdans-afc03) : rien ici ne touche ces applis.
// Ces valeurs identifient le projet ; elles ne sont pas secrètes : la sécurité repose sur les règles Firestore.
// SDK chargé par balise <script type="module"> depuis le CDN Google, version proposée par la console :
//   https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js (+ firebase-auth.js, firebase-firestore.js)
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/13.2.0";
// Hébergement : GitHub Pages du compte nonomisu (domaine autorisé dans Firebase Authentication).
export const PAGES_DOMAIN = "nonomisu.github.io";
// À remplir avec les valeurs du nouveau projet (console Firebase › Paramètres du projet › Vos applications).
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

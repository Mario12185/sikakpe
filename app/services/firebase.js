// 📦 app/services/firebase.js — INITIALISATION UNIQUE
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 🔐 Remplace par TES valeurs (Console Firebase > Paramètres du projet > Général)
const firebaseConfig = {
  apiKey: "TA_API_KEY_ICI",
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

// ✅ Initialise l'app AVANT toute autre chose
const app = initializeApp(firebaseConfig);

// 📤 Exporte les instances prêtes à l'emploi
export const db = getFirestore(app);
export const auth = getAuth(app);
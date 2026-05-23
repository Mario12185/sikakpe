// 📦 app/services/firebase.js — VERSION CLEAN (sans auto-connect)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // ✅ Pas de signInAnonymously ici

const firebaseConfig = {
  apiKey: "AIzaSyApxSY6dCyhRCSU2qo6g0tFh14KnN84ZGM",
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.firebasestorage.app",
  messagingSenderId: "1073940291184",
  appId: "1:1073940291184:web:f29ea161da46358b645eb5",
  measurementId: "G-T411L52GHV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// ❌ Pas de ensureAuth() — on laisse l'utilisateur choisir de se connecter
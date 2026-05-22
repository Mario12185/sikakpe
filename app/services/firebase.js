// 📦 app/services/firebase.js — CONFIGURATION RÉELLE SIKAKPÉ
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// 🔐 TA CONFIGURATION RÉELLE (copiée de la Console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyApxSY6dCyhRCSU2qo6g0tFh14KnN84ZGM",
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.firebasestorage.app",
  messagingSenderId: "1073940291184",
  appId: "1:1073940291184:web:f29ea161da46358b645eb5",
  measurementId: "G-T411L52GHV"
};

// ✅ Initialisation Firebase
const app = initializeApp(firebaseConfig);

// 📤 Exports pour toute l'app
export const db = getFirestore(app);
export const auth = getAuth(app);

// 🔐 Connexion anonyme automatique (garanti)
export const ensureAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
};
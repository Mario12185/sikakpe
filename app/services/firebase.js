// app/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// 🔥 TA CONFIGURATION FIREBASE (copiée depuis la console)
const firebaseConfig = {
  apiKey: "AIzaSyApxSY6dCyhRCSU2qo6g0tFh14KnN84ZGM",
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.firebasestorage.app",
  messagingSenderId: "1073940291184",
  appId: "1:1073940291184:web:f29ea161da46358b645eb5"
};

// Initialisation sécurisée (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Services exportés (compatible Web + Mobile)
export const db = getFirestore(app);
export const auth = getAuth(app);  // ✅ Simple et compatible web
export const storage = getStorage(app);

export default app;
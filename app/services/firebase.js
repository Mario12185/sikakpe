// app/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ⚠️ CONFIG EN DUR REQUISE POUR GITHUB PAGES (les .env ne sont pas lus)
const firebaseConfig = {
  apiKey: "AIzaSyApxSY6dCyhRCSU2qo6g0tFh14KnN84ZGM",
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.firebasestorage.app",
  messagingSenderId: "1073940291184",
  appId: "1:1073940291184:web:f29ea161da46358b645eb5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
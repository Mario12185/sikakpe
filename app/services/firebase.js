New-Item -ItemType Directory -Force -Path "app/services"
@'
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD...", // ← REMPLACE PAR TA VRAIE API KEY
  authDomain: "sikakpe-togo.firebaseapp.com",
  projectId: "sikakpe-togo",
  storageBucket: "sikakpe-togo.appspot.com",
  messagingSenderId: "123456789", // ← REMPLACE
  appId: "1:123456789:web:abcdef" // ← REMPLACE
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const ensureAuth = async () => {
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
};
'@ | Out-File -FilePath "app/services/firebase.js" -Encoding utf8
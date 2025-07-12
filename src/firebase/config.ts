import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDcfsWZlyF4y3l7mn103dVpS24t1eEWzS8",
  authDomain: "skillswap-4d16a.firebaseapp.com",
  projectId: "skillswap-4d16a",
  storageBucket: "skillswap-4d16a.firebasestorage.app",
  messagingSenderId: "101881618006",
  appId: "1:101881618006:web:c5e77c19fb2f20cb82a5f7",
  measurementId: "G-JKQKKJL85D"
};

// Initialize Firebase app only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';

// Environment variables configuration for Vite & Vercel
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'modern-cogency-hlcf1',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:984379765739:web:80ebc3f8202761cdd41fae',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCMVb1mP1pF8D8TDqC-Lpn6pP6asigTkyo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'modern-cogency-hlcf1.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'modern-cogency-hlcf1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '984379765739',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-storemanagements-286dd381-5157-4d57-9e8b-67a93bd87287',
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with custom database ID if provided
export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Enable offline persistence with multi-tab scenario handling
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch(() => {
      // Offline persistence is optional; real-time listener remains active
    });
  } catch {
    // Graceful fallback for restricted iframe sandbox
  }
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey
);
export default db;

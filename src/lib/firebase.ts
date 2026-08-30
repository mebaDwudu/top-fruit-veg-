// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// ✅ Use environment variables (VITE_ prefix for Vite)
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '',
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with custom database ID if provided
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// ✅ Enable offline persistence (fixes your sync issue)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('🔥 Offline persistence enabled successfully!');
  })
  .catch((err: unknown) => {
    if (err && typeof err === 'object' && 'code' in err) {
      const error = err as { code: string };
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Persistence failed: Multiple tabs open.');
      } else if (error.code === 'unimplemented') {
        console.warn('⚠️ Persistence not supported by this browser.');
      }
    } else {
      console.error('❌ Unknown persistence error:', err);
    }
  });

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey
);
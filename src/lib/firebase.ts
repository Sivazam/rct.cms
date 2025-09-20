// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCn0OL6-s6mq0FvWORZ2kDLN1lEqM-ADvo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rctscm01.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rctscm01",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rctscm01.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "254761013200",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:254761013200:web:4b82ce8ff1a8733f1333d5"
};

// Initialize Firebase
let app;
let functions;
try {
  app = initializeApp(firebaseConfig);
  // Initialize Firebase Functions
  functions = getFunctions(app, 'us-central1'); // Specify your region
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Fallback for build time - create a mock app
  app = {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
    delete: () => Promise.resolve()
  };
  // Mock functions for build time
  functions = null;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { functions, httpsCallable };

export default app;
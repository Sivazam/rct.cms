// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn0OL6-s6mq0FvWORZ2kDLN1lEqM-ADvo",
  authDomain: "rctscm01.firebaseapp.com",
  projectId: "rctscm01",
  storageBucket: "rctscm01.firebasestorage.app",
  messagingSenderId: "254761013200",
  appId: "1:254761013200:web:4b82ce8ff1a8733f1333d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
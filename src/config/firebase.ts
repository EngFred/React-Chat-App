import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Define the Firebase configuration type
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string; // Optional, not always required
}

// Hardcoded fake Firebase configuration values
// REMEMBER TO REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIGURATION
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyBbM08QBmlBXqiacudpKN9clNzPgGndgKs",
  authDomain: "my-chat-app-1f56b.firebaseapp.com",
  projectId: "my-chat-app-1f56b",
  storageBucket: "my-chat-app-1f56b.firebasestorage.app",
  messagingSenderId: "586931630478",
  appId: "1:586931630478:web:0bed731f299c81f0bb74df",
  measurementId: "G-4Z507HDVNH"
};

// Hardcoded fake app ID
// REMEMBER TO REPLACE THIS WITH YOUR ACTUAL APP ID IF NEEDED FOR FIRESTORE RULES
export const appId = firebaseConfig.appId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
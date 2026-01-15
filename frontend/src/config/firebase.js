// Firebase Configuration for React Frontend
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web App Configuration
// This matches the backend Firebase project: kotapal-1e8f6
const firebaseConfig = {
  apiKey: "AIzaSyCNU1QFZhmUuk2QWDeNi4ff3-le4KNnbrU",
  authDomain: "KotaPal-1e8f6.firebaseapp.com",
  projectId: "kotapal-1e8f6",
  storageBucket: "KotaPal-1e8f6.firebasestorage.app",
  messagingSenderId: "487227333489",
  appId: "1:487227333489:web:a370f5e07b9e4c3d79f4d0",
  measurementId: "G-8GQ7JGDZ7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;


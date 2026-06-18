/**
 * Shared Firebase configuration for KotaPal (main app + admin dashboard).
 * Single source of truth - update here for index.html (main app + admin).
 *
 * To get your config: Firebase Console > Project Settings > Your apps > Web app
 */
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyCNU1QFZhmUuk2QWDeNi4ff3-le4KNnbrU",
    authDomain: "kotapal-1e8f6.firebaseapp.com",
    projectId: "kotapal-1e8f6",
    storageBucket: "kotapal-1e8f6.firebasestorage.app",
    messagingSenderId: "487227333489",
    appId: "1:487227333489:web:a370f5e07b9e4c3d79f4d0",
    measurementId: "G-8GQ7JGDZ7P"
};

/** Leave empty on Firebase Hosting (API rewrites to Cloud Functions on same domain). */
window.KOTAPAL_API_BASE = '';

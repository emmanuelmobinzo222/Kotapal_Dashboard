// Firebase Configuration and Initialization
const admin = require('firebase-admin');

let initialized = false;
let firestore = null;
let FieldValue = null;

function isFirebaseConfigured() {
  return !!(
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id' &&
    (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_ADMIN_SDK_KEY
    )
  );
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured. Using local JSON database.');
    return false;
  }

  if (initialized) {
    return true;
  }

  try {
    let credential;

    // Option 1: Service account JSON file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      credential = admin.credential.cert(serviceAccount);
    }
    // Option 2: Base64 encoded key (for deployment)
    else if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const keyBuffer = Buffer.from(process.env.FIREBASE_ADMIN_SDK_KEY, 'base64');
      const serviceAccount = JSON.parse(keyBuffer.toString('utf-8'));
      credential = admin.credential.cert(serviceAccount);
    }
    // Option 3: Direct JSON config in environment
    else if (process.env.FIREBASE_CONFIG) {
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      credential = admin.credential.cert(firebaseConfig);
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    firestore = admin.firestore();
    FieldValue = admin.firestore.FieldValue;
    initialized = true;
    
    console.log('✓ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('Falling back to local JSON database');
    initialized = false;
    return false;
  }
}

function getFirestore() {
  return firestore;
}

function getFieldValue() {
  return FieldValue;
}

function isInitialized() {
  return initialized;
}

module.exports = {
  initFirebase,
  isFirebaseConfigured,
  getFirestore,
  getFieldValue,
  isInitialized
};


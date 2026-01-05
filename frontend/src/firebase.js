// Firebase Configuration for KotaPal
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  enableIndexedDbPersistence,
  onSnapshot
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNU1QFZhmUuk2QWDeNi4ff3-le4KNnbrU",
  authDomain: "kotapal-1e8f6.firebaseapp.com",
  projectId: "kotapal-1e8f6",
  storageBucket: "kotapal-1e8f6.firebasestorage.app",
  messagingSenderId: "487227333489",
  appId: "1:487227333489:web:a370f5e07b9e4c3d79f4d0",
  measurementId: "G-8GQ7JGDZ7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence for Firestore
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    }
  });
} catch (err) {
  console.warn('Error enabling Firestore persistence:', err);
}

// Auth functions
export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Create account with email and password
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      return { success: true, error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify password reset code
  async verifyResetCode(code) {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { email, error: null };
    } catch (error) {
      return { email: null, error: error.message };
    }
  },

  // Confirm password reset
  async confirmReset(code, newPassword) {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore functions for user data
export const firebaseDB = {
  // Save user profile to Firestore
  async saveUserProfile(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user profile from Firestore
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      }
      return { data: null, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { data: null, error: error.message };
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user blocks with real-time updates
  subscribeToUserBlocks(userId, callback) {
    const blocksRef = collection(db, 'blocks');
    const q = query(blocksRef, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(blocks);
    }, (error) => {
      console.error('Error subscribing to blocks:', error);
      callback([]);
    });
  },

  // Save block to Firestore
  async saveBlock(blockData) {
    try {
      const blockRef = doc(db, 'blocks', blockData.id);
      await setDoc(blockRef, {
        ...blockData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saving block:', error);
      return { success: false, error: error.message };
    }
  },

  // Get integrations
  async getUserIntegrations(userId) {
    try {
      const integrationsRef = collection(db, 'integrations');
      const q = query(integrationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const integrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: integrations, error: null };
    } catch (error) {
      console.error('Error getting integrations:', error);
      return { data: [], error: error.message };
    }
  }
};

// Offline sync manager
export const offlineManager = {
  // Queue for pending operations when offline
  pendingQueue: [],

  // Check if online
  isOnline() {
    return navigator.onLine;
  },

  // Add operation to pending queue
  addToPendingQueue(operation) {
    const queue = JSON.parse(localStorage.getItem('kotaPendingQueue') || '[]');
    queue.push({
      ...operation,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('kotaPendingQueue', JSON.stringify(queue));
  },

  // Process pending queue when back online
  async processPendingQueue() {
    const queue = JSON.parse(localStorage.getItem('kotaPendingQueue') || '[]');
    if (queue.length === 0) return;

    console.log('Processing pending queue:', queue.length, 'operations');
    const processedIds = [];

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'updateProfile':
            await firebaseDB.updateUserProfile(operation.userId, operation.data);
            break;
          case 'saveBlock':
            await firebaseDB.saveBlock(operation.data);
            break;
          default:
            console.warn('Unknown operation type:', operation.type);
        }
        processedIds.push(operation.timestamp);
      } catch (error) {
        console.error('Error processing queued operation:', error);
      }
    }

    // Remove processed operations
    const remaining = queue.filter(op => !processedIds.includes(op.timestamp));
    localStorage.setItem('kotaPendingQueue', JSON.stringify(remaining));
    
    if (processedIds.length > 0) {
      console.log('Synced', processedIds.length, 'pending operations');
    }
  },

  // Cache user data locally
  cacheUserData(key, data) {
    try {
      localStorage.setItem(`kota_cache_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  },

  // Get cached user data
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`kota_cache_${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    return null;
  },

  // Clear all cached data
  clearCache() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('kota_cache_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - syncing data...');
    offlineManager.processPendingQueue();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline - data will be cached locally');
  });
}

export { auth, db };
export default app;

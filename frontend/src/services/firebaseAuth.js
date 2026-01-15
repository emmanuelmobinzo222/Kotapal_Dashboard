// Firebase Authentication Service
// This provides Firebase Authentication as an alternative to backend API authentication
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Register a new user with Firebase Authentication
 * Also creates a user document in Firestore
 */
export async function registerWithFirebase(userData) {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const user = userCredential.user;
    
    // Update user profile with display name
    if (userData.name) {
      await updateProfile(user, {
        displayName: userData.name
      });
    }
    
    // Create user document in Firestore
    const userDoc = {
      id: user.uid,
      name: userData.name,
      email: userData.email,
      website: userData.website || '',
      plan: userData.plan || 'starter',
      createdAt: new Date().toISOString(),
      affiliateIds: {},
      settings: {
        notifications: true,
        theme: 'light'
      }
    };
    
    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    return {
      user: userDoc,
      token: await user.getIdToken()
    };
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Login with Firebase Authentication
 */
export async function loginWithFirebase(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    let userData;
    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
    } else {
      // If user document doesn't exist, create it
      userData = {
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email,
        website: '',
        plan: 'starter',
        createdAt: new Date().toISOString(),
        affiliateIds: {},
        settings: {
          notifications: true,
          theme: 'light'
        }
      };
      await setDoc(userDocRef, userData);
    }
    
    return {
      user: userData,
      token: await user.getIdToken()
    };
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

/**
 * Logout from Firebase
 */
export async function logoutFromFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message || 'Logout failed');
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get Firebase ID token
 */
export async function getFirebaseToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}


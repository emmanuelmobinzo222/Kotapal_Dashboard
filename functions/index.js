const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

/**
 * HTTP API: GET /api/users
 * Returns all registered users. Requires Authorization: Bearer <firebase-id-token>
 * Admin emails only. Use from admin dashboard or any client with valid admin token.
 */
async function fetchAllUsers() {
  const auth = getAuth();
  const db = getFirestore();
  const firestoreSnap = await db.collection('users').get();
  const firestoreByUid = {};
  firestoreSnap.docs.forEach(d => { firestoreByUid[d.id] = d.data(); });
  const users = [];
  let pageToken;
  do {
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;
    for (const u of listResult.users) {
      const fs = firestoreByUid[u.uid] || {};
      users.push({
        id: u.uid,
        email: u.email || '',
        name: fs.displayName || u.displayName || u.email?.split('@')[0] || '—',
        plan: fs.plan || 'starter',
        status: fs.status || 'active',
        joined: fs.signupDate || fs.createdAt || u.metadata.creationTime || '',
        lastSignIn: u.metadata.lastSignInTime || ''
      });
    }
  } while (pageToken);
  return users;
}

/**
 * Callable: syncUsersToFirestore
 * Backfills Firestore users collection from Firebase Auth. Call once to sync existing Auth users.
 */
exports.syncUsersToFirestore = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const email = request.auth.token.email;
  if (!isAdmin(email)) throw new HttpsError('permission-denied', 'Admin access required.');

  const auth = getAuth();
  const db = getFirestore();
  let count = 0;
  let pageToken;

  do {
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;
    for (const u of listResult.users) {
      await db.collection('users').doc(u.uid).set({
        email: u.email || '',
        displayName: u.displayName || u.email?.split('@')[0] || '—',
        plan: 'starter',
        status: 'active',
        signupDate: u.metadata.creationTime || new Date().toISOString(),
        lastSignIn: u.metadata.lastSignInTime || ''
      }, { merge: true });
      count++;
    }
  } while (pageToken);

  return { success: true, synced: count };
});

const ADMIN_EMAILS = ['admin@kotapal.com', 'wreck@gmail.com', 'earlhugue@gmail.com', 'emmanuelmobinzo222@gmail.com', 'emmanuelmobinzo21@gmail.com'];

function isAdmin(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  return ADMIN_EMAILS.includes(e);
}

/**
 * Callable function: listAllUsers
 * Returns all Firebase Auth users + Firestore user data merged.
 * Only callable by admins (admin@kotapal.com, wreck@gmail.com, earlhugue@gmail.com).
 */
exports.listAllUsers = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  const email = request.auth.token.email;
  if (!isAdmin(email)) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  const users = await fetchAllUsers();
  return { users };
});

/**
 * HTTP API: GET /api/users
 * Returns all users. Requires Authorization: Bearer <firebase-id-token> (admin only).
 */
exports.apiUsers = onRequest({ region: 'us-central1', cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization');
    res.status(204).send('');
    return;
  }
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(idToken);
    if (!isAdmin(decoded.email)) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const users = await fetchAllUsers();
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ users });
  } catch (err) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * Callable function: adminSuspendUser
 * Suspends a user in Firebase Auth (disables login) and updates Firestore status.
 * Real-time: user cannot log in immediately after suspension.
 */
exports.adminSuspendUser = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const email = request.auth.token.email;
  if (!isAdmin(email)) throw new HttpsError('permission-denied', 'Admin access required.');

  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required.');

  const auth = getAuth();
  const db = getFirestore();

  await auth.updateUser(uid, { disabled: true });
  await db.collection('users').doc(uid).set({ status: 'suspended' }, { merge: true });

  return { success: true, message: 'User suspended. They cannot log in.' };
});

/**
 * Callable function: adminUnsuspendUser
 * Re-enables a user in Firebase Auth and updates Firestore status.
 */
exports.adminUnsuspendUser = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const email = request.auth.token.email;
  if (!isAdmin(email)) throw new HttpsError('permission-denied', 'Admin access required.');

  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required.');

  const auth = getAuth();
  const db = getFirestore();

  await auth.updateUser(uid, { disabled: false });
  await db.collection('users').doc(uid).set({ status: 'active' }, { merge: true });

  return { success: true, message: 'User unsuspended. They can log in again.' };
});

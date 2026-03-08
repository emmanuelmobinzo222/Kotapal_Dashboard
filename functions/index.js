const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

const ADMIN_EMAILS_FALLBACK = ['admin@kotapal.com', 'wreck@gmail.com', 'earlhugue@gmail.com', 'emmanuelmobinzo222@gmail.com', 'emmanuelmobinzo21@gmail.com'];

async function isAdmin(email, db) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (ADMIN_EMAILS_FALLBACK.includes(e)) return true;
  try {
    const snap = await db.collection('config').doc('admins').get();
    const emails = snap.exists && snap.data().emails ? snap.data().emails : [];
    return emails.some(x => (x || '').toLowerCase() === e);
  } catch (_) {
    return false;
  }
}

/**
 * Callable function: listAllUsers
 * Returns all Firebase Auth users. Uses config/admins from Firestore for admin check.
 */
exports.listAllUsers = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  const db = getFirestore();
  const email = request.auth.token.email;
  if (!(await isAdmin(email, db))) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const auth = getAuth();

  // Fetch all Firestore user docs in one query
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
      const created = u.metadata.creationTime || '';
      const lastSignIn = u.metadata.lastSignInTime || '';
      users.push({
        id: u.uid,
        email: u.email || '',
        name: fs.displayName || u.displayName || u.email?.split('@')[0] || '—',
        plan: fs.plan || 'starter',
        status: fs.status || 'active',
        joined: fs.signupDate || fs.createdAt || created,
        lastSignIn
      });
    }
  } while (pageToken);

  return { users };
});

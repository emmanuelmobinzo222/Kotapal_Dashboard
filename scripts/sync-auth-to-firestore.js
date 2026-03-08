/**
 * Sync Firebase Auth users to Firestore users collection.
 * Run this once to populate Firestore with users who registered via Firebase Auth
 * but may not have been written to Firestore (e.g. created in Firebase Console).
 *
 * Prerequisites:
 * 1. npm install
 * 2. Download service account key: Firebase Console > Project Settings > Service Accounts > Generate new key
 * 3. Set: set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccountKey.json (Windows)
 *    or: export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json (Mac/Linux)
 *
 * Usage: npm run sync:auth-firestore
 */

const admin = require('firebase-admin');
const path = require('path');

const PROJECT_ID = 'kotapal-1e8f6';

async function main() {
  if (!admin.apps.length) {
    try {
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');
      const fs = require('fs');
      if (fs.existsSync(keyPath)) {
        const serviceAccount = require(keyPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else {
        admin.initializeApp({ projectId: PROJECT_ID });
      }
    } catch (e) {
      console.error('Failed to initialize Firebase Admin. Ensure:');
      console.error('  1. firebase-admin is installed: npm install');
      console.error('  2. Service account key: Firebase Console > Project Settings > Service Accounts > Generate new key');
      console.error('  3. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in project root');
      process.exit(1);
    }
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let pageToken;
  let total = 0;

  do {
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;

    const batch = db.batch();
    for (const userRecord of listResult.users) {
      const ref = db.collection('users').doc(userRecord.uid);
      batch.set(ref, {
        email: userRecord.email || '',
        displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '—',
        plan: 'starter',
        signupDate: userRecord.metadata.creationTime || new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _syncedFromAuth: true
      }, { merge: true });
      total++;
    }
    await batch.commit();
  } while (pageToken);

  console.log(`Synced ${total} user(s) from Firebase Auth to Firestore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

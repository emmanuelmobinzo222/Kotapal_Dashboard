/**
 * One-time setup: store the platform SearchAPI key in Firestore for Cloud Functions.
 * Run from project root after: npm install && firebase login
 *
 *   node scripts/seed-platform-product-lookup.js
 *
 * Or set SEARCHAPI_API_KEY in functions/.env before firebase deploy --only functions
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'functions', '.env') });

const admin = require('firebase-admin');

const apiKey = String(process.env.SEARCHAPI_API_KEY || '').trim();
if (!apiKey || /^(your[-_])?(searchapi|provider)[-_]?key$/i.test(apiKey)) {
  console.error('Set SEARCHAPI_API_KEY in .env or functions/.env before running this script.');
  process.exit(1);
}

try {
  admin.initializeApp();
} catch (e) {
  /* already initialized */
}

admin.firestore().doc('platform/productLookup').set({
  apiKey,
  searchApiKey: apiKey,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true })
  .then(function() {
    console.log('Platform product lookup key saved to Firestore (platform/productLookup).');
    process.exit(0);
  })
  .catch(function(err) {
    console.error('Failed to seed platform key:', err.message);
    process.exit(1);
  });

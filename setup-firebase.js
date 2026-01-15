// Script to verify Firebase configuration and setup
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('\n🔍 Firebase Configuration Check\n');
console.log('================================\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '❌ NOT SET');
console.log('   GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET');
console.log('');

// Check if firebase-key.json exists
console.log('2. Firebase Key File:');
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-key.json';
const resolvedPath = path.resolve(process.cwd(), keyPath);
console.log('   Expected path:', resolvedPath);
console.log('   File exists:', fs.existsSync(resolvedPath) ? '✅ YES' : '❌ NO');

if (fs.existsSync(resolvedPath)) {
  try {
    const keyData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    console.log('   Project ID in file:', keyData.project_id || '❌ NOT FOUND');
    console.log('   Client email:', keyData.client_email || '❌ NOT FOUND');
    console.log('   Has private key:', keyData.private_key ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.log('   ❌ Error reading file:', error.message);
  }
}
console.log('');

// Test Firebase initialization
console.log('3. Testing Firebase Initialization:');
const store = require('./src/store');

store.initFirebase()
  .then((success) => {
    if (success) {
      console.log('   ✅ Firebase initialized successfully!');
      const status = store.getFirebaseStatus();
      console.log('   Status:', JSON.stringify(status, null, 2));
      console.log('\n✅ All checks passed! Firebase is ready to store user data.\n');
      process.exit(0);
    } else {
      console.log('   ❌ Firebase initialization failed');
      console.log('\n❌ Firebase is not configured. User data will be stored locally only.\n');
      console.log('To fix this, create a .env file with:');
      console.log('   FIREBASE_PROJECT_ID=kotapal-1e8f6');
      console.log('   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.log('   ❌ Error:', error.message);
    console.log('\n❌ Firebase initialization failed. Check your configuration.\n');
    process.exit(1);
  });


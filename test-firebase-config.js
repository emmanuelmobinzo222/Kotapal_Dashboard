// Test Firebase Configuration
require('dotenv').config();

console.log('🔍 Testing Firebase Configuration...\n');

console.log('Environment Variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('');

// Check if Firebase is configured
const store = require('./src/store');

async function testFirebase() {
  try {
    console.log('🔄 Initializing Firebase...');
    const initialized = await store.initFirebase();
    
    if (initialized) {
      console.log('✅ Firebase initialized successfully!');
      console.log('✅ Data will be saved to Firebase Firestore');
      console.log('');
      console.log('📝 Next steps:');
      console.log('1. Restart your server (npm start)');
      console.log('2. Sign up a new user');
      console.log('3. Check Firebase Console → Firestore Database');
      console.log('4. You should see the user in the "users" collection');
    } else {
      console.log('❌ Firebase initialization failed!');
      console.log('⚠️  The server will use local JSON database instead');
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Check that firebase-key.json exists in the project root');
      console.log('2. Verify FIREBASE_PROJECT_ID in .env matches your Firebase project');
      console.log('3. Check that GOOGLE_APPLICATION_CREDENTIALS points to firebase-key.json');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFirebase();


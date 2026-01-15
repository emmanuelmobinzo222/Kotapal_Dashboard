// Script to create a test user in Firebase/server database
require('dotenv').config();
const store = require('./src/store');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
  try {
    console.log('🔄 Initializing Firebase...');
    const initialized = await store.initFirebase();
    
    if (!initialized) {
      console.error('❌ Firebase not initialized!');
      console.log('⚠️  Make sure your .env file has:');
      console.log('   - FIREBASE_PROJECT_ID=kotapal-1e8f6');
      console.log('   - GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json');
      process.exit(1);
    }
    
    console.log('✅ Firebase initialized');
    
    // Test user credentials
    const testUser = {
      id: uuidv4(),
      name: 'Test User',
      email: 'test@kotapal.com',
      password: await bcrypt.hash('Test123!@#', 12),
      website: 'https://test.example.com',
      plan: 'pro',
      createdAt: new Date().toISOString(),
      settings: {
        notifications: true,
        theme: 'light'
      }
    };
    
    // Check if user already exists
    const existingUser = await store.getUserByEmail(testUser.email);
    if (existingUser) {
      console.log('⚠️  Test user already exists!');
      console.log('');
      console.log('📧 Email: test@kotapal.com');
      console.log('🔑 Password: Test123!@#');
      console.log('');
      console.log('✅ You can use these credentials to log in from anywhere!');
      return;
    }
    
    console.log('📝 Creating test user...');
    const createdUser = await store.createUser(testUser);
    
    console.log('');
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   TEST LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:    test@kotapal.com');
    console.log('🔑 Password: Test123!@#');
    console.log('');
    console.log('✅ These credentials are stored in Firebase Firestore');
    console.log('✅ You can log in from ANY device, ANY location worldwide');
    console.log('✅ Works from South Africa, USA, Europe, Asia, etc.');
    console.log('');
    console.log('🌐 Test it at: https://kotapal.com (or your domain)');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    
    // Verify the user was saved
    const verifyUser = await store.getUserByEmail(testUser.email);
    if (verifyUser) {
      console.log('✅ Verification: User found in database');
      console.log('✅ User ID:', verifyUser.id);
    } else {
      console.error('❌ Verification failed: User not found after creation!');
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createTestUser();


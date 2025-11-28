// Script to create a test user with a known password for offline login
const bcrypt = require('bcryptjs');
const db = require('./src/db');

async function createTestUser() {
  try {
    // Hash password "test123" (you can change this)
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const testUser = {
      id: 'test_user_' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      website: '',
      plan: 'starter',
      createdAt: new Date().toISOString(),
      affiliateIds: {},
      settings: {
        notifications: true,
        theme: 'light'
      }
    };
    
    // Check if user already exists
    const existingUser = db.state.users.find(u => u.email === testUser.email);
    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email:', testUser.email);
      console.log('To reset password, delete the user from data/data.json and run this script again.');
      return;
    }
    
    // Add user to database
    db.state.users.push(testUser);
    db.save();
    
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: test@example.com');
    console.log('  Password: test123');
    console.log('');
    console.log('You can now login at: http://localhost:3001/login');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Run the script
createTestUser();


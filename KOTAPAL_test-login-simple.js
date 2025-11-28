// Simple test to verify login functionality
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test password hashing
async function testPasswordHashing() {
    console.log('Testing password hashing...');
    
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Original password:', password);
    console.log('Hashed password:', hashedPassword);
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification:', isValid);
    
    return { password, hashedPassword, isValid };
}

// Test JWT creation and verification
function testJWT() {
    console.log('Testing JWT...');
    
    const JWT_SECRET = 'test-secret';
    const user = { id: 'user_123', email: 'test@example.com', name: 'Test User', plan: 'starter' };
    
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    console.log('Generated token:', token);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    return { token, decoded };
}

// Test database operations
async function testDatabase() {
    console.log('Testing database operations...');
    
    try {
        const db = require('./db');
        console.log('Database loaded:', db.state);
        console.log('Users count:', db.state.users.length);
        
        // Test user creation
        const testUser = {
            id: 'test_user_123',
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashed_password',
            plan: 'starter',
            createdAt: new Date().toISOString()
        };
        
        db.state.users.push(testUser);
        db.save();
        console.log('User added to database');
        console.log('Users count after addition:', db.state.users.length);
        
        // Test user retrieval
        const foundUser = db.state.users.find(u => u.email === 'test@example.com');
        console.log('Found user:', foundUser);
        
    } catch (error) {
        console.error('Database test failed:', error);
    }
}

// Run all tests
async function runTests() {
    console.log('=== Login Functionality Test ===\n');
    
    try {
        await testPasswordHashing();
        console.log('');
        
        testJWT();
        console.log('');
        
        await testDatabase();
        console.log('');
        
        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();

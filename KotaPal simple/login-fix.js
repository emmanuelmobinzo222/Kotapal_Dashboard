// Comprehensive login fix and test
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002; // Use port 3002 to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory database for testing
let users = [];
let nextId = 1;

// JWT Secret
const JWT_SECRET = 'kota-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kota Login Fix Server Running',
    users: users.length,
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, website, plan = 'starter' } = req.body;
    
    console.log('Registration attempt:', { name, email, plan, website });

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: `user_${nextId++}`,
      name,
      email,
      password: hashedPassword,
      website: website || '',
      plan,
      createdAt: new Date().toISOString(),
      affiliateIds: {},
      settings: {
        notifications: true,
        theme: 'light'
      }
    };

    users.push(newUser);
    console.log('User created:', { id: newUser.id, name: newUser.name, email: newUser.email, plan: newUser.plan });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, plan: newUser.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: pwd, ...userWithoutPassword } = newUser;
    res.status(201).json({
      user: userWithoutPassword,
      token,
      redirectPage: newUser.plan === 'pro' ? 'analytics' : (newUser.plan === 'creatorplus' ? 'integrations' : (newUser.plan === 'agency' ? 'integrations' : 'dashboard'))
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Incorrect password for this email address' });
    }

    console.log('Login successful:', { id: user.id, name: user.name, email: user.email, plan: user.plan });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: pwd, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token,
      redirectPage: user.plan === 'pro' ? 'analytics' : (user.plan === 'creatorplus' ? 'integrations' : (user.plan === 'agency' ? 'integrations' : 'dashboard'))
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for debugging)
app.get('/api/debug/users', (req, res) => {
  res.json({
    count: users.length,
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, plan: u.plan, createdAt: u.createdAt }))
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    users: users.length,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Kota Login Fix Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/user/profile');
  console.log('- GET /api/debug/users');
  console.log('- GET /api/health');
});

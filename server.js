// Enhanced Kota Smart Product Platform Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cron = require('node-cron');
const axios = require('axios');

// Import our modules
const store = require('./src/store');
const affiliateAPIs = require('./src/affiliate-apis');
const analytics = require('./src/analytics');
const embedGenerator = require('./src/embed-generator');
const aiService = require('./src/ai-service');
const authService = require('./src/auth-service');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.amazon.com", "https://api.walmart.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database (Firebase/Supabase) - Offline-capable with local fallback
(async () => { 
  try {
    const firebaseConfig = require('./src/firebase-config');
    const supabaseConfig = require('./src/supabase-config');
    
    let dbType = 'Local JSON'; // Default to local for offline support
    
    // Only try cloud databases if explicitly configured (for offline support)
    const hasFirebaseConfig = firebaseConfig.isFirebaseConfigured && firebaseConfig.isFirebaseConfigured();
    const hasSupabaseConfig = supabaseConfig.isSupabaseConfigured && supabaseConfig.isSupabaseConfigured();
    
    if (hasSupabaseConfig) {
      try {
        const supabaseInitialized = await supabaseConfig.initSupabase();
        if (supabaseInitialized) {
          dbType = 'Supabase';
        }
      } catch (error) {
        console.log('Supabase unavailable (offline?), using local database');
      }
    }
    
    if (dbType === 'Local JSON' && hasFirebaseConfig) {
      try {
        const firebaseStoreInitialized = await store.initFirebase();
        if (firebaseStoreInitialized) {
          dbType = 'Firebase';
        }
      } catch (error) {
        console.log('Firebase unavailable (offline?), using local database');
      }
    }
    
    // Ensure local database is always initialized for offline support
    if (dbType === 'Local JSON') {
      const db = require('./src/db');
      db.ensureDataFile(); // Initialize local JSON database
      console.log('✓ Local JSON database ready (offline-capable)');
    }
    
    console.log('Database initialized - using:', dbType);
    console.log('✓ Offline login supported with local database');
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Using Local JSON database (offline mode)');
    // Ensure local database works even if initialization fails
    try {
      const db = require('./src/db');
      db.ensureDataFile();
      console.log('✓ Local JSON database initialized');
    } catch (dbError) {
      console.error('Local database initialization failed:', dbError);
    }
  }
})();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// Input sanitization
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\n\r\t]/g, ' ').trim();
};

// Validation helper
function validateFields(requiredFields, source) {
  const errors = [];
  for (const [field, rule] of Object.entries(requiredFields)) {
    const val = source[field];
    if (rule.required && (val === undefined || val === null || val === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (val !== undefined) {
      if (rule.type && typeof val !== rule.type) {
        errors.push(`${field} must be a ${rule.type}`);
      }
      if (rule.maxLength && typeof val === 'string' && val.length > rule.maxLength) {
        errors.push(`${field} exceeds max length ${rule.maxLength}`);
      }
    }
  }
  return errors;
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kota Smart Product Platform API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Kota Smart Product Platform API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/user/profile': 'Get user profile',
        'PUT /api/user/profile': 'Update user profile'
      },
      blocks: {
        'GET /api/blocks': 'Get user blocks',
        'POST /api/blocks': 'Create new block',
        'PUT /api/blocks/:id': 'Update block',
        'DELETE /api/blocks/:id': 'Delete block'
      },
      products: {
        'GET /api/products/search': 'Search products',
        'GET /api/products/:id': 'Get product details'
      },
      analytics: {
        'GET /api/analytics': 'Get analytics data',
        'GET /api/alerts': 'Get performance alerts'
      },
      integrations: {
        'GET /api/integrations': 'Get user integrations',
        'POST /api/integrations': 'Create/update integration'
      },
      embed: {
        'GET /r/:userId/:blockId/:productId': 'Click tracking redirect',
        'GET /api/embed/:blockId': 'Get embed code'
      }
    }
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, website, plan = 'starter' } = req.body;

    const errors = validateFields({
      name: { required: true, type: 'string', maxLength: 120 },
      email: { required: true, type: 'string', maxLength: 200 },
      password: { required: true, type: 'string', maxLength: 200 }
    }, { name, email, password });

    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    // Check if user exists
    const existingUser = await store.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Validate plan
    const allowedPlans = ['starter', 'pro', 'creatorplus', 'agency'];
    const userPlan = allowedPlans.includes(plan) ? plan : 'starter';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: uuidv4(),
      name: sanitizeString(name),
      email: sanitizeString(email),
      password: hashedPassword,
      website: website ? sanitizeString(website) : '',
      plan: userPlan,
      createdAt: new Date().toISOString(),
      affiliateIds: {},
      settings: {
        notifications: true,
        theme: 'light'
      }
    };

    // Normalize email (lowercase and trim) for consistency
    newUser.email = newUser.email.toLowerCase().trim();
    
    console.log('📝 Creating user in database:', newUser.email);
    console.log('📝 User data:', { id: newUser.id, name: newUser.name, email: newUser.email, plan: newUser.plan });
    const createdUser = await store.createUser(newUser);
    console.log('✅ User created successfully:', createdUser.email, 'ID:', createdUser.id);

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
      redirectPage: userPlan === 'pro' ? 'analytics' : (userPlan === 'creatorplus' ? 'integrations' : (userPlan === 'agency' ? 'integrations' : 'dashboard'))
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = validateFields({
      email: { required: true, type: 'string', maxLength: 200 },
      password: { required: true, type: 'string', maxLength: 200 }
    }, { email, password });

    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    // Find user
    const user = await store.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password for this email address' });
    }

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

// Verify Token Endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await store.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: pwd, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token and get user info
    const googleUser = await authService.verifyGoogleToken(idToken);
    
    // Check if user exists
    let user = await store.getUserByEmail(googleUser.email);
    
    if (!user) {
      // Create new user
      const newUser = {
        id: uuidv4(),
        name: googleUser.name,
        email: googleUser.email,
        password: '', // No password for OAuth users
        googleId: googleUser.googleId,
        picture: googleUser.picture,
        website: '',
        plan: 'starter',
        createdAt: new Date().toISOString(),
        affiliateIds: {},
        settings: {
          notifications: true,
          theme: 'light'
        }
      };
      user = await store.createUser(newUser);
      
      // Send welcome email
      await authService.sendWelcomeEmail(user.email, user.name);
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        await store.updateUser(user.id, { 
          googleId: googleUser.googleId,
          picture: googleUser.picture 
        });
      }
    }

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
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await store.getUserByEmail(email);
    
    // Always return success message for security (don't reveal if email exists)
    if (user) {
      // Generate reset token
      const resetToken = authService.generateResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      
      // Store reset token
      await store.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      // Send reset email
      try {
        await authService.sendPasswordResetEmail(user.email, resetToken, user.id);
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Still return success to user
      }
    }

    res.json({ 
      message: 'If an account with that email exists, we\'ve sent password reset instructions.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;

    if (!token || !userId || !newPassword) {
      return res.status(400).json({ error: 'Token, user ID, and new password are required' });
    }

    // Validate token
    const tokenData = await store.getPasswordResetToken(token);
    
    if (!tokenData || tokenData.userId !== userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await store.updateUser(userId, { password: hashedPassword });
    
    // Delete used token
    await store.deletePasswordResetToken(token);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await store.getUserById(req.user.id);
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

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, website, settings } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = sanitizeString(name);
    if (email !== undefined) updates.email = sanitizeString(email);
    if (website !== undefined) updates.website = sanitizeString(website);
    if (settings !== undefined) updates.settings = settings;

    const updated = await store.updateUser(req.user.id, updates);
    res.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blocks Routes
app.get('/api/blocks', authenticateToken, async (req, res) => {
  try {
    const userBlocks = await store.listBlocksByUser(req.user.id);
    res.json(userBlocks);
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/blocks', authenticateToken, async (req, res) => {
  try {
    const { title, layout, ctaText, productsList, customCSS, customJS } = req.body;

    const errors = validateFields({
      title: { required: true, type: 'string', maxLength: 200 },
      layout: { required: true, type: 'string', maxLength: 40 }
    }, { title, layout });

    if (!productsList || !Array.isArray(productsList)) {
      errors.push('productsList must be an array');
    }
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    // Check plan limits
    const user = await store.getUserById(req.user.id);
    const userBlocks = await store.listBlocksByUser(req.user.id);
    
    let maxBlocks, maxProducts;
    switch (user.plan) {
      case 'starter':
        maxBlocks = 5;
        maxProducts = 3;
        break;
      case 'pro':
        maxBlocks = 50;
        maxProducts = 10;
        break;
      case 'creatorplus':
        maxBlocks = Infinity;
        maxProducts = 20;
        break;
      default:
        maxBlocks = 5;
        maxProducts = 3;
    }

    if (userBlocks.length >= maxBlocks && maxBlocks !== Infinity) {
      return res.status(400).json({ error: `You've reached your limit of ${maxBlocks} blocks for the ${user.plan} plan.` });
    }

    if (productsList.length > maxProducts) {
      return res.status(400).json({ error: `Your ${user.plan} plan allows maximum ${maxProducts} products per block.` });
    }

    // Create new block
    const newBlock = {
      id: `blk_${Date.now()}`,
      userId: req.user.id,
      title: sanitizeString(title),
      layout,
      ctaText: ctaText || 'Buy Now',
      products: productsList.length,
      productsList,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      lastUpdated: new Date().toISOString(),
      status: 'draft',
      retailer: productsList[0]?.retailer || 'amazon',
      customCSS: customCSS || '',
      customJS: customJS || '',
      embedCode: '',
      createdAt: new Date().toISOString()
    };

    // Generate embed code
    newBlock.embedCode = embedGenerator.generateEmbedCode(newBlock);

    const created = await store.createBlock(newBlock);
    res.status(201).json(created);
  } catch (error) {
    console.error('Create block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/blocks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, layout, ctaText, productsList, status, customCSS, customJS } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = sanitizeString(title);
    if (layout !== undefined) updates.layout = layout;
    if (ctaText !== undefined) updates.ctaText = ctaText;
    if (productsList !== undefined) { 
      updates.productsList = productsList; 
      updates.products = productsList.length; 
    }
    if (status !== undefined) updates.status = status;
    if (customCSS !== undefined) updates.customCSS = customCSS;
    if (customJS !== undefined) updates.customJS = customJS;
    
    updates.lastUpdated = new Date().toISOString();

    // Regenerate embed code if block data changed
    if (title !== undefined || layout !== undefined || productsList !== undefined) {
      const block = await store.getBlockById(id);
      if (block) {
        const updatedBlock = { ...block, ...updates };
        updates.embedCode = embedGenerator.generateEmbedCode(updatedBlock);
      }
    }

    const updated = await store.updateBlock(req.user.id, id, updates);
    if (!updated) return res.status(404).json({ error: 'Block not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/blocks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await store.deleteBlock(req.user.id, id);
    if (!removed) return res.status(404).json({ error: 'Block not found' });
    res.json({ message: 'Block deleted successfully', block: removed });
  } catch (error) {
    console.error('Delete block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product Search Routes
app.get('/api/products/search', authenticateToken, async (req, res) => {
  try {
    const { retailer, query, category, limit = 20 } = req.query;

    if (!retailer || !query) {
      return res.status(400).json({ error: 'Retailer and query are required' });
    }

    const products = await affiliateAPIs.searchProducts(retailer, query, { category, limit });
    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { retailer } = req.query;

    if (!retailer) {
      return res.status(400).json({ error: 'Retailer is required' });
    }

    const product = await affiliateAPIs.getProductDetails(retailer, id);
    res.json(product);
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Routes
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const { dateRange = 'last30days', retailer = 'all', blockId } = req.query;
    
    const analyticsData = await analytics.getAnalytics(req.user.id, {
      dateRange,
      retailer,
      blockId
    });
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await analytics.getAlerts(req.user.id);
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Integrations Routes
app.get('/api/integrations', authenticateToken, async (req, res) => {
  try {
    const userIntegrations = await store.listIntegrations(req.user.id);
    res.json(userIntegrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations', authenticateToken, async (req, res) => {
  try {
    const { id, name, affiliateId, apiKey, secretKey } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Integration ID and name are required' });
    }

    const integration = {
      id,
      userId: req.user.id,
      name,
      affiliateId: affiliateId || '',
      apiKey: apiKey || '',
      secretKey: secretKey || '',
      status: affiliateId ? 'connected' : 'disconnected',
      lastSync: affiliateId ? 'Just now' : 'Never',
      createdAt: new Date().toISOString()
    };

    const updated = await store.upsertIntegration(integration);
    res.status(201).json(updated);
  } catch (error) {
    console.error('Create/update integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Click Tracking Route
app.get('/r/:userId/:blockId/:productId', async (req, res) => {
  try {
    const { userId, blockId, productId } = req.params;
    const { retailer } = req.query;

    // Log click
    const click = {
      id: `click_${Date.now()}`,
      userId,
      blockId,
      productId,
      retailer: retailer || 'unknown',
      timestamp: new Date().toISOString(),
      referrer: req.get('Referrer') || null,
      userAgent: req.get('User-Agent') || null,
      ip: req.ip || null,
      country: req.get('CF-IPCountry') || null
    };

    await store.addClick(click);

    // Get user's affiliate ID
    const user = await store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate affiliate URL
    const redirectUrl = await affiliateAPIs.generateAffiliateUrl(
      retailer, 
      productId, 
      user.affiliateIds[retailer] || `${retailer}-user`
    );

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Embed Code Route
app.get('/api/embed/:blockId', async (req, res) => {
  try {
    const { blockId } = req.params;
    const block = await store.getBlockById(blockId);
    
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({
      blockId,
      embedCode: block.embedCode,
      title: block.title,
      status: block.status
    });
  } catch (error) {
    console.error('Get embed code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Routes
app.post('/api/ai/generate-blurb', authenticateToken, async (req, res) => {
  try {
    const { productName, productDetails, tone } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const blurb = await aiService.generateProductBlurb(productName, productDetails || '', tone || 'professional');
    res.json({ blurb });
  } catch (error) {
    console.error('Generate blurb error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/ai/generate-pros-cons', authenticateToken, async (req, res) => {
  try {
    const { productName, productDetails } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await aiService.generateProsCons(productName, productDetails || '');
    res.json(result);
  } catch (error) {
    console.error('Generate pros/cons error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/ai/suggest-alternatives', authenticateToken, async (req, res) => {
  try {
    const { productName, budget } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await aiService.suggestAlternatives(productName, budget || '');
    res.json(result);
  } catch (error) {
    console.error('Suggest alternatives error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/ai/generate-faq', authenticateToken, async (req, res) => {
  try {
    const { productName, productDetails, count } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await aiService.generateFAQ(productName, productDetails || '', count || 5);
    res.json(result);
  } catch (error) {
    console.error('Generate FAQ error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve React app for all other routes (only if file exists, for production builds)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // In development, frontend runs on separate port
    res.status(404).json({ 
      error: 'Not found',
      message: 'Frontend is running on http://localhost:3001. Please access the application there.',
      frontendUrl: 'http://localhost:3001'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Scheduled tasks
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily analytics update...');
  try {
    await analytics.updateDailyMetrics();
  } catch (error) {
    console.error('Daily analytics update failed:', error);
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Kota Smart Product Platform running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🌐 Frontend URL: http://localhost:3001`);
  console.log(`✓ CORS enabled for: http://localhost:3001`);
  console.log(`\nDatabase initialized - using: Firebase\n`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the process using this port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

module.exports = app;

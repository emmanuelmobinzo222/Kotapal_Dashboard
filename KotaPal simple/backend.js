// server.js - Node.js backend for KOTA PAL

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const store = require('./store');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Handle CORS preflight explicitly (helps when opened from file:// or other origins)
app.options('*', cors());

// Serve static frontend (dashboard)
const staticDir = path.join(__dirname);
app.use(express.static(staticDir));

// Simple input sanitization middleware for strings
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\n\r\t]/g, ' ').trim();
};

// Basic validator helper
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

// Very simple in-memory rate limiter (per IP per route)
const rateBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120; // 120 req/min per IP per route
function rateLimiter(req, res, next) {
  const key = `${req.ip || 'unknown'}:${req.path}`;
  const now = Date.now();
  if (!rateBuckets.has(key)) {
    rateBuckets.set(key, []);
  }
  const timestamps = rateBuckets.get(key);
  // prune old
  while (timestamps.length && now - timestamps[0] > RATE_LIMIT_WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  timestamps.push(now);
  next();
}

// Apply rate limiter globally (can be tuned per-route later)
app.use(rateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Use JSON file persistence
// Initialize Firebase if configured, else local db fallback
(async () => { await store.initFirebase(); })();

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

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'KOTA PAL API is running' });
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(staticDir, 'dashboard.html'));
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    // sanitize inputs
    req.body.name = sanitizeString(req.body.name);
    req.body.email = sanitizeString(req.body.email);
    let { name, email, password, website, plan = 'starter' } = req.body;

    const errors = validateFields({
      name: { required: true, type: 'string', maxLength: 120 },
      email: { required: true, type: 'string', maxLength: 200 },
      password: { required: true, type: 'string', maxLength: 200 }
    }, { name, email, password });
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    // Check if user already exists
    const existingUser = await store.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Normalize/validate plan
    const allowedPlans = new Set(['starter','pro','creatorplus','agency']);
    if (!allowedPlans.has(plan)) plan = 'starter';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      website: website ? sanitizeString(website) : '',
      plan,
      createdAt: new Date().toISOString().split('T')[0],
      affiliateIds: {}
    };

    await store.createUser(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: pwd, ...userWithoutPassword } = newUser;
    const redirectPage = plan === 'pro' ? 'analytics' : (plan === 'creatorplus' ? 'integrations' : (plan === 'agency' ? 'integrations' : 'dashboard'));
    res.status(201).json({
      user: userWithoutPassword,
      token,
      redirectPage
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
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

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: pwd, ...userWithoutPassword } = user;
    const plan = user.plan || 'starter';
    const redirectPage = plan === 'pro' ? 'analytics' : (plan === 'creatorplus' ? 'integrations' : (plan === 'agency' ? 'integrations' : 'dashboard'));
    res.json({
      user: userWithoutPassword,
      token,
      redirectPage
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await store.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, website } = req.body;
    const user = await store.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await store.updateUser(req.user.id, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(website !== undefined ? { website } : {})
    });
    res.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all blocks for user
app.get('/api/blocks', authenticateToken, async (req, res) => {
  try {
    const userBlocks = await store.listBlocksByUser(req.user.id);
    res.json(userBlocks);
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new block
app.post('/api/blocks', authenticateToken, async (req, res) => {
  try {
    const { title, layout, ctaText, productsList } = req.body;

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
      title,
      layout,
      ctaText: ctaText || 'Buy Now',
      products: productsList.length,
      productsList,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'draft',
      retailer: productsList[0]?.retailer || 'amazon'
    };

    const created = await store.createBlock(newBlock);
    res.status(201).json(created);
  } catch (error) {
    console.error('Create block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update block
app.put('/api/blocks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, layout, ctaText, productsList, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (layout !== undefined) updates.layout = layout;
    if (ctaText !== undefined) updates.ctaText = ctaText;
    if (productsList !== undefined) { updates.productsList = productsList; updates.products = productsList.length; }
    if (status !== undefined) updates.status = status;
    updates.lastUpdated = new Date().toISOString().split('T')[0];
    const updated = await store.updateBlock(req.user.id, id, updates);
    if (!updated) return res.status(404).json({ error: 'Block not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete block
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

// Get all integrations for user
app.get('/api/integrations', authenticateToken, async (req, res) => {
  try {
    const userIntegrations = await store.listIntegrations(req.user.id);
    res.json(userIntegrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update integration
app.post('/api/integrations', authenticateToken, async (req, res) => {
  try {
    const { id, name, affiliateId } = req.body;

    // Validate input
    if (!id || !name) {
      return res.status(400).json({ error: 'Integration ID and name are required' });
    }

    const updated = await store.upsertIntegration({ id, userId: req.user.id, name, affiliateId: affiliateId || '', status: affiliateId ? 'connected' : 'disconnected', lastSync: affiliateId ? 'Just now' : 'Never' });
    res.status(201).json(updated);
  } catch (error) {
    console.error('Create/update integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect/disconnect integration
app.post('/api/integrations/:id/connect', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { affiliateId } = req.body;
    const updated = await store.upsertIntegration({ id, userId: req.user.id, name: id, affiliateId: affiliateId || '', status: 'connected', lastSync: 'Just now' });
    res.json(updated);
  } catch (error) {
    console.error('Connect integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations/:id/disconnect', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await store.upsertIntegration({ id, userId: req.user.id, name: id, affiliateId: '', status: 'disconnected', lastSync: 'Never' });
    res.json(updated);
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync integration
app.post('/api/integrations/:id/sync', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const list = await store.listIntegrations(req.user.id);
    const current = list.find(i => i.id === id);
    if (!current) return res.status(404).json({ error: 'Integration not found' });
    if (current.status !== 'connected') {
      return res.status(400).json({ error: 'Integration is not connected' });
    }

    const updated = await store.upsertIntegration({ ...current, lastSync: 'Just now' });
    res.json(updated);
  } catch (error) {
    console.error('Sync integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search products from retailers
app.get('/api/products/search', authenticateToken, async (req, res) => {
  try {
    const { retailer, query } = req.query;

    // Validate input
    if (!retailer || !query) {
      return res.status(400).json({ error: 'Retailer and query are required' });
    }

    // Mock product search - in production, integrate with actual APIs
    let products = [];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (retailer) {
      case 'amazon':
        products = [
          {
            id: 'amz_1',
            title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
            price: 299.99,
            originalPrice: 349.99,
            rating: 4.8,
            reviews: 12478,
            availability: 'In Stock',
            asin: 'B09XYZ1234',
            category: 'Electronics',
            retailer: 'amazon'
          },
          {
            id: 'amz_2',
            title: 'Bose QuietComfort 45 Headphones',
            image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
            price: 279.99,
            originalPrice: 329.99,
            rating: 4.7,
            reviews: 8923,
            availability: 'In Stock',
            asin: 'B08XYZ5678',
            category: 'Electronics',
            retailer: 'amazon'
          },
          {
            id: 'amz_3',
            title: 'Apple AirPods Max',
            image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
            price: 549.00,
            originalPrice: 549.00,
            rating: 4.6,
            reviews: 6789,
            availability: 'In Stock',
            asin: 'B09XYZ9012',
            category: 'Electronics',
            retailer: 'amazon'
          }
        ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
        break;
      case 'walmart':
        products = [
          {
            id: 'wlm_1',
            title: 'Samsung 55" Class Crystal UHD TU-8000 Series',
            image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHR2fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
            price: 499.99,
            originalPrice: 599.99,
            rating: 4.5,
            reviews: 3456,
            availability: 'In Stock',
            itemId: '123456789',
            category: 'TV & Home Theater',
            retailer: 'walmart'
          },
          {
            id: 'wlm_2',
            title: 'Dyson V11 Cordless Vacuum Cleaner',
            image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmFjdXVtfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
            price: 599.00,
            originalPrice: 699.00,
            rating: 4.7,
            reviews: 2345,
            availability: 'In Stock',
            itemId: '987654321',
            category: 'Home & Kitchen',
            retailer: 'walmart'
          }
        ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
        break;
      case 'shopify':
        products = [
          {
            id: 'shp_1',
            title: 'Premium Yoga Mat - Eco Friendly',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8eW9nYSUyMG1hdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
            price: 49.99,
            originalPrice: 69.99,
            rating: 4.9,
            reviews: 1234,
            availability: 'In Stock',
            productId: 'prod_123',
            category: 'Fitness',
            retailer: 'shopify'
          },
          {
            id: 'shp_2',
            title: 'Organic Cotton T-Shirt - Unisex',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dCUyMHNoaXJ0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
            price: 29.99,
            originalPrice: 39.99,
            rating: 4.6,
            reviews: 890,
            availability: 'In Stock',
            productId: 'prod_456',
            category: 'Clothing',
            retailer: 'shopify'
          }
        ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
        break;
      case 'skimlinks':
        products = [
          {
            id: 'skm_1',
            title: 'Nike Air Max 270',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c25lYWtlcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
            price: 150.00,
            originalPrice: 160.00,
            rating: 4.5,
            reviews: 4567,
            availability: 'In Stock',
            productId: 'nike_123',
            category: 'Footwear',
            retailer: 'skimlinks'
          },
          {
            id: 'skm_2',
            title: 'Instant Pot Duo 7-in-1',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW5zdGFudCUyMHBvdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
            price: 89.99,
            originalPrice: 99.99,
            rating: 4.8,
            reviews: 15678,
            availability: 'In Stock',
            productId: 'ip_456',
            category: 'Kitchen',
            retailer: 'skimlinks'
          }
        ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
        break;
      default:
        return res.status(400).json({ error: 'Unsupported retailer' });
    }

    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product details
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { retailer } = req.query;

    // Validate input
    if (!retailer) {
      return res.status(400).json({ error: 'Retailer is required' });
    }

    // Mock product details - in production, integrate with actual APIs
    let product = null;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user's affiliate ID for this retailer
    const user = await store.getUserById(req.user.id);
    const affiliateId = (user && user.affiliateIds && user.affiliateIds[retailer]) ? user.affiliateIds[retailer] : `${retailer}-user`;

    switch (retailer) {
      case 'amazon':
        product = {
          id,
          affiliateUrl: `https://www.amazon.com/dp/${id.split('_')[1]}?tag=${affiliateId}`,
          lastUpdated: new Date().toISOString()
        };
        break;
      case 'walmart':
        product = {
          id,
          affiliateUrl: `https://www.walmart.com/ip/${id.split('_')[1]}?affid=${affiliateId}`,
          lastUpdated: new Date().toISOString()
        };
        break;
      case 'shopify':
        product = {
          id,
          affiliateUrl: `https://store.shopify.com/products/${id.split('_')[1]}?ref=${affiliateId}`,
          lastUpdated: new Date().toISOString()
        };
        break;
      case 'skimlinks':
        product = {
          id,
          affiliateUrl: `https://skimlinks.com/redirect/${id}?affid=${affiliateId}`,
          lastUpdated: new Date().toISOString()
        };
        break;
      default:
        return res.status(400).json({ error: 'Unsupported retailer' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log click and redirect
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
      ip: req.ip || null
    };

    await store.addClick(click);

    // Find user's affiliate ID for this retailer
    const user = await store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const affiliateId = (user && user.affiliateIds && user.affiliateIds[retailer]) ? user.affiliateIds[retailer] : `${retailer}-user`;

    // Generate affiliate URL based on retailer
    let redirectUrl = '#';
    switch (retailer) {
      case 'amazon':
        redirectUrl = `https://www.amazon.com/dp/${productId.split('_')[1]}?tag=${affiliateId}`;
        break;
      case 'walmart':
        redirectUrl = `https://www.walmart.com/ip/${productId.split('_')[1]}?affid=${affiliateId}`;
        break;
      case 'shopify':
        redirectUrl = `https://store.shopify.com/products/${productId.split('_')[1]}?ref=${affiliateId}`;
        break;
      case 'skimlinks':
        redirectUrl = `https://skimlinks.com/redirect/${productId}?affid=${affiliateId}`;
        break;
      default:
        redirectUrl = '#';
    }

    // Redirect to affiliate URL
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics data
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const { dateRange = 'last30days', retailer = 'all' } = req.query;

    // Filter blocks by user
    let userBlocks = await store.listBlocksByUser(req.user.id);

    // Filter by retailer if specified
    if (retailer !== 'all') {
      userBlocks = userBlocks.filter(b => b.retailer === retailer);
    }

    // Filter by date range if needed (simplified for demo)
    // In production, you would filter by actual date ranges

    // Calculate analytics
    const totalClicks = userBlocks.reduce((sum, block) => sum + block.clicks, 0);
    const totalRevenue = userBlocks.reduce((sum, block) => sum + block.revenue, 0);
    const avgCTR = userBlocks.length > 0 ? (userBlocks.reduce((sum, block) => sum + block.ctr, 0) / userBlocks.length) : 0;
    const blocksCount = userBlocks.length;

    // Find top performers
    let topBlock = userBlocks.length > 0 ? userBlocks[0] : null;
    if (userBlocks.length > 1) {
      topBlock = userBlocks.reduce((max, block) => block.revenue > max.revenue ? block : max);
    }

    const analytics = {
      totalClicks,
      totalRevenue,
      avgCTR: parseFloat(avgCTR.toFixed(2)),
      blocksCount,
      topBlock: topBlock ? topBlock.title : '',
      topProduct: topBlock && topBlock.productsList.length > 0 ? topBlock.productsList[0].title : ''
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    // Mock alerts based on user's blocks
    const userBlocks = await store.listBlocksByUser(req.user.id);
    
    const alerts = [];
    
    // Add low CTR alert for blocks with CTR < 2
    const lowCtrBlocks = userBlocks.filter(b => b.ctr < 2 && b.clicks > 10);
    lowCtrBlocks.forEach(block => {
      alerts.push({
        id: `alert_lowctr_${block.id}`,
        type: 'warning',
        title: 'Low Converting Block',
        message: `Your "${block.title}" block has a low CTR of ${block.ctr}%. Consider updating the product selection or CTA text.`,
        timestamp: new Date().toISOString()
      });
    });
    
    // Add top performer alert for blocks with CTR > 4
    const topCtrBlocks = userBlocks.filter(b => b.ctr > 4);
    topCtrBlocks.forEach(block => {
      alerts.push({
        id: `alert_topctr_${block.id}`,
        type: 'success',
        title: 'Top Performer',
        message: `Your "${block.title}" block is performing exceptionally well with a ${block.ctr}% CTR!`,
        timestamp: new Date().toISOString()
      });
    });
    
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`KOTA PAL API server running on port ${PORT}`);
});

module.exports = app;
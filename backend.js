// server.js - Node.js backend for KOTA PAL

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock database (in production, use Firebase, MongoDB, or PostgreSQL)
let users = [
  {
    id: 'user_123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    plan: 'pro',
    createdAt: '2024-01-15',
    affiliateIds: {
      amazon: 'john-20',
      walmart: 'walmart-123',
      shopify: 'shopify-store',
      skimlinks: 'skim-456'
    }
  }
];

let blocks = [
  {
    id: 'blk_1',
    userId: 'user_123',
    title: 'Best Headphones 2024',
    layout: 'grid',
    ctaText: 'Buy Now',
    products: 3,
    clicks: 1247,
    revenue: 89.42,
    ctr: 3.2,
    lastUpdated: '2024-05-15',
    status: 'active',
    retailer: 'amazon',
    productsList: [
      { id: 'amz_1', title: 'Sony WH-1000XM5', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80', price: 299.99 },
      { id: 'amz_2', title: 'Bose QuietComfort 45', image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80', price: 279.99 },
      { id: 'amz_3', title: 'Apple AirPods Max', image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80', price: 549.00 }
    ]
  },
  {
    id: 'blk_2',
    userId: 'user_123',
    title: 'Top Smart TVs',
    layout: 'carousel',
    ctaText: 'Check Price',
    products: 2,
    clicks: 892,
    revenue: 67.85,
    ctr: 2.8,
    lastUpdated: '2024-05-14',
    status: 'active',
    retailer: 'walmart',
    productsList: [
      { id: 'wlm_1', title: 'Samsung 55" Class Crystal UHD', image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHR2fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80', price: 499.99 },
      { id: 'wlm_2', title: 'Dyson V11 Cordless Vacuum', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmFjdXVtfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80', price: 599.00 }
    ]
  }
];

let integrations = [
  { id: 'amazon', userId: 'user_123', name: 'Amazon Associates', status: 'connected', lastSync: '2 hours ago', affiliateId: 'john-20' },
  { id: 'walmart', userId: 'user_123', name: 'Walmart Affiliate', status: 'connected', lastSync: '1 day ago', affiliateId: 'walmart-123' },
  { id: 'shopify', userId: 'user_123', name: 'Shopify Partner', status: 'disconnected', lastSync: 'Never', affiliateId: '' },
  { id: 'skimlinks', userId: 'user_123', name: 'Skimlinks', status: 'connected', lastSync: '3 hours ago', affiliateId: 'skim-456' }
];

let clicks = [];

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

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, plan = 'starter' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      plan,
      createdAt: new Date().toISOString().split('T')[0],
      affiliateIds: {}
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: pwd, ...userWithoutPassword } = newUser;
    res.status(201).json({
      user: userWithoutPassword,
      token
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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: pwd, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
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

    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { name, email, website } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user data
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (website !== undefined) users[userIndex].website = website;

    // Return updated user data
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all blocks for user
app.get('/api/blocks', authenticateToken, (req, res) => {
  try {
    const userBlocks = blocks.filter(b => b.userId === req.user.id);
    res.json(userBlocks);
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new block
app.post('/api/blocks', authenticateToken, (req, res) => {
  try {
    const { title, layout, ctaText, productsList } = req.body;

    // Validate input
    if (!title || !layout || !productsList || !Array.isArray(productsList)) {
      return res.status(400).json({ error: 'Title, layout, and products are required' });
    }

    // Check plan limits
    const user = users.find(u => u.id === req.user.id);
    const userBlocks = blocks.filter(b => b.userId === req.user.id);
    
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

    blocks.push(newBlock);
    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Create block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update block
app.put('/api/blocks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, layout, ctaText, productsList, status } = req.body;

    const blockIndex = blocks.findIndex(b => b.id === id && b.userId === req.user.id);
    if (blockIndex === -1) {
      return res.status(404).json({ error: 'Block not found' });
    }

    // Update block data
    if (title !== undefined) blocks[blockIndex].title = title;
    if (layout !== undefined) blocks[blockIndex].layout = layout;
    if (ctaText !== undefined) blocks[blockIndex].ctaText = ctaText;
    if (productsList !== undefined) {
      blocks[blockIndex].productsList = productsList;
      blocks[blockIndex].products = productsList.length;
    }
    if (status !== undefined) blocks[blockIndex].status = status;
    
    blocks[blockIndex].lastUpdated = new Date().toISOString().split('T')[0];

    res.json(blocks[blockIndex]);
  } catch (error) {
    console.error('Update block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete block
app.delete('/api/blocks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const blockIndex = blocks.findIndex(b => b.id === id && b.userId === req.user.id);

    if (blockIndex === -1) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const deletedBlock = blocks.splice(blockIndex, 1)[0];
    res.json({ message: 'Block deleted successfully', block: deletedBlock });
  } catch (error) {
    console.error('Delete block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all integrations for user
app.get('/api/integrations', authenticateToken, (req, res) => {
  try {
    const userIntegrations = integrations.filter(i => i.userId === req.user.id);
    res.json(userIntegrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update integration
app.post('/api/integrations', authenticateToken, (req, res) => {
  try {
    const { id, name, affiliateId } = req.body;

    // Validate input
    if (!id || !name) {
      return res.status(400).json({ error: 'Integration ID and name are required' });
    }

    const integrationIndex = integrations.findIndex(i => i.id === id && i.userId === req.user.id);

    if (integrationIndex === -1) {
      // Create new integration
      const newIntegration = {
        id,
        userId: req.user.id,
        name,
        affiliateId: affiliateId || '',
        status: affiliateId ? 'connected' : 'disconnected',
        lastSync: affiliateId ? 'Just now' : 'Never'
      };
      integrations.push(newIntegration);
      res.status(201).json(newIntegration);
    } else {
      // Update existing integration
      if (affiliateId !== undefined) {
        integrations[integrationIndex].affiliateId = affiliateId;
        integrations[integrationIndex].status = affiliateId ? 'connected' : 'disconnected';
        integrations[integrationIndex].lastSync = 'Just now';
      }
      res.json(integrations[integrationIndex]);
    }
  } catch (error) {
    console.error('Create/update integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect/disconnect integration
app.post('/api/integrations/:id/connect', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { affiliateId } = req.body;

    const integrationIndex = integrations.findIndex(i => i.id === id && i.userId === req.user.id);
    if (integrationIndex === -1) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    integrations[integrationIndex].status = 'connected';
    if (affiliateId) {
      integrations[integrationIndex].affiliateId = affiliateId;
    }
    integrations[integrationIndex].lastSync = 'Just now';

    res.json(integrations[integrationIndex]);
  } catch (error) {
    console.error('Connect integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations/:id/disconnect', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const integrationIndex = integrations.findIndex(i => i.id === id && i.userId === req.user.id);
    if (integrationIndex === -1) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    integrations[integrationIndex].status = 'disconnected';
    integrations[integrationIndex].lastSync = 'Never';

    res.json(integrations[integrationIndex]);
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync integration
app.post('/api/integrations/:id/sync', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const integrationIndex = integrations.findIndex(i => i.id === id && i.userId === req.user.id);
    if (integrationIndex === -1) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (integrations[integrationIndex].status !== 'connected') {
      return res.status(400).json({ error: 'Integration is not connected' });
    }

    integrations[integrationIndex].lastSync = 'Just now';

    res.json(integrations[integrationIndex]);
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
      case 'ebay':
        products = [
          {
            id: '226713039768',
            title: 'Unlocked Apple iPhone SE 3rd Gen - Black 64GB',
            image: 'https://i.ebayimg.com/images/g/KUkAAOSw~CtoBToW/s-l500.jpg',
            price: 99.99,
            originalPrice: 149.99,
            rating: 5,
            reviews: 304,
            availability: 'In Stock',
            item_id: '226713039768',
            condition: 'Pre-Owned',
            retailer: 'ebay'
          },
          {
            id: '335217770415',
            title: 'Nike Air Jordan 1 Chicago Lost & Found - Size 10.5 Mens',
            image: 'https://i.ebayimg.com/images/g/CJYAAOSwmtFlqsPp/s-l500.jpg',
            price: 449.99,
            originalPrice: 499.99,
            rating: 5,
            reviews: 16,
            availability: 'In Stock',
            item_id: '335217770415',
            condition: 'Brand New',
            retailer: 'ebay'
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
    const user = users.find(u => u.id === req.user.id);
    const affiliateId = user.affiliateIds[retailer] || `${retailer}-user`;

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
      case 'ebay':
        product = {
          id,
          affiliateUrl: `https://www.ebay.com/itm/${id.replace(/^ebay_/, '')}?mkevt=1&mkcid=1&campid=${affiliateId}`,
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

    clicks.push(click);

    // Find user's affiliate ID for this retailer
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const affiliateId = user.affiliateIds[retailer] || `${retailer}-user`;

    // Generate affiliate URL based on retailer
    let redirectUrl = '#';
    switch (retailer) {
      case 'amazon':
        redirectUrl = `https://www.amazon.com/dp/${productId.split('_')[1]}?tag=${affiliateId}`;
        break;
      case 'walmart':
        redirectUrl = `https://www.walmart.com/ip/${productId.split('_')[1]}?affid=${affiliateId}`;
        break;
      case 'ebay':
        redirectUrl = `https://www.ebay.com/itm/${String(productId).replace(/^ebay_/, '')}?mkevt=1&mkcid=1&campid=${affiliateId}`;
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
app.get('/api/analytics', authenticateToken, (req, res) => {
  try {
    const { dateRange = 'last30days', retailer = 'all' } = req.query;

    // Filter blocks by user
    let userBlocks = blocks.filter(b => b.userId === req.user.id);

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
app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    // Mock alerts based on user's blocks
    const userBlocks = blocks.filter(b => b.userId === req.user.id);
    
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
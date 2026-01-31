/**
 * Enhanced KOTA PAL Backend with Real-time Integration
 * Incorporates multi-retailer APIs, WebSocket updates, and advanced analytics
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
require('dotenv').config();

// Import services
const { RetailerIntegrationService } = require('./services/retailerIntegration');
const RealTimeDataPipeline = require('./services/realTimeDataPipeline');
const WebSocketService = require('./services/websocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize services
let retailerService;
let realTimeDataPipeline;
let websocketService;

async function initializeServices() {
  try {
    // Initialize Retailer Integration Service
    retailerService = new RetailerIntegrationService({
      cacheStdTTL: 3600,
      maxRetries: 3,
      requestTimeout: 10000
    });

    // Initialize Real-time Data Pipeline
    realTimeDataPipeline = new RealTimeDataPipeline({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      aggregationWindow: 60000
    });

    await realTimeDataPipeline.connect();

    // Initialize WebSocket Service
    websocketService = new WebSocketService(server, {
      heartbeatInterval: 30000
    });

    // Setup event listeners
    setupEventListeners();

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
  }
}

/**
 * Setup event listeners for real-time updates
 */
function setupEventListeners() {
  // Retailer service events
  retailerService.on('data-fetched', (data) => {
    console.log(`Data fetched from ${data.retailer}: ${data.itemsCount} items`);
    websocketService.publishToChannel(`bestsellers:${data.retailer}`, data);
  });

  retailerService.on('error', (error) => {
    console.error('Retailer service error:', error);
    websocketService.broadcast({
      type: 'error',
      category: 'retailer-integration',
      message: error.error
    });
  });

  // Real-time pipeline events
  realTimeDataPipeline.on('click-recorded', (data) => {
    websocketService.publishToUser(data.userId, {
      type: 'click-recorded',
      data
    });
  });

  realTimeDataPipeline.on('bestsellers-updated', (data) => {
    websocketService.publishToChannel(`bestsellers:${data.retailer}`, {
      type: 'bestsellers-updated',
      data
    });
  });

  realTimeDataPipeline.on('aggregation-flushed', (data) => {
    websocketService.publishToChannel('analytics', {
      type: 'analytics-updated',
      data
    });
  });
}

// Mock database
let users = [
  {
    id: 'user_123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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

let blocks = [];
let integrations = [];
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

// ===========================
// Health Check Endpoints
// ===========================

app.get('/', (req, res) => {
  res.json({ 
    message: 'KOTA PAL API is running',
    version: '2.0.0',
    features: ['multi-retailer-integration', 'real-time-updates', 'websockets']
  });
});

// ===========================
// Authentication Routes
// ===========================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, plan = 'starter' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

// ===========================
// Real-time Integration Routes
// ===========================

/**
 * Fetch best-selling items from retailers
 */
app.get('/api/bestsellers/:retailer', authenticateToken, async (req, res) => {
  try {
    const { retailer } = req.params;
    const { category = 'electronics', limit = 20 } = req.query;

    const bestSellers = await retailerService.fetchBestSellers(retailer, {
      category,
      limit: parseInt(limit)
    });

    const items = Array.isArray(bestSellers) ? bestSellers : [];

    websocketService.publishToChannel(`bestsellers:${retailer}`, {
      type: 'bestsellers-fetched',
      retailer,
      itemsCount: items.length,
      timestamp: new Date()
    });

    res.json({
      retailer,
      items,
      timestamp: new Date(),
      cached: false
    });
  } catch (error) {
    console.error('Bestsellers fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch click analytics for a retailer
 */
app.get('/api/analytics/:retailer', authenticateToken, async (req, res) => {
  try {
    const { retailer } = req.params;
    const { dateRange = '7d' } = req.query;

    const analytics = await retailerService.fetchClickAnalytics(retailer, {
      dateRange,
      blockId: req.query.blockId
    });

    res.json({
      retailer,
      analytics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get real-time metrics dashboard
 */
app.get('/api/dashboard/realtime', authenticateToken, async (req, res) => {
  try {
    const { retailer = 'all' } = req.query;
    const userId = req.user.id;

    const metrics = {};

    if (retailer === 'all') {
      const retailers = ['amazon', 'walmart', 'shopify', 'skimlinks'];
      for (const r of retailers) {
        try {
          metrics[r] = await realTimeDataPipeline.getRealTimeMetrics(userId, r);
        } catch (error) {
          metrics[r] = null;
        }
      }
    } else {
      metrics[retailer] = await realTimeDataPipeline.getRealTimeMetrics(userId, retailer);
    }

    res.json({
      userId,
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Realtime metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trending products
 */
app.get('/api/trending/:retailer', authenticateToken, async (req, res) => {
  try {
    const { retailer } = req.params;
    
    const trending = await realTimeDataPipeline.getTrendingProducts(retailer);

    res.json({
      retailer,
      trending,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Record click event
 */
app.post('/api/events/click', authenticateToken, async (req, res) => {
  try {
    const { blockId, productId, retailer, revenue = 0 } = req.body;
    const userId = req.user.id;

    const event = {
      type: 'click',
      data: {
        userId,
        blockId,
        productId,
        retailer,
        revenue
      },
      timestamp: new Date().toISOString()
    };

    await realTimeDataPipeline.enqueueEvent(event, 'high');

    res.status(202).json({
      message: 'Click event queued for processing',
      eventId: `evt_${Date.now()}`
    });
  } catch (error) {
    console.error('Click event error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get service metrics
 */
app.get('/api/system/metrics', authenticateToken, async (req, res) => {
  try {
    const retailerMetrics = retailerService.getMetrics();
    const wsMetrics = websocketService.getStatistics();

    res.json({
      retailerService: retailerMetrics,
      websocket: wsMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync retailers data manually
 */
app.post('/api/sync/retailers', authenticateToken, async (req, res) => {
  try {
    const { retailers = ['amazon', 'walmart', 'shopify', 'skimlinks'] } = req.body;

    const results = await retailerService.aggregateMultiRetailerData(
      retailers,
      'fetchBestSellers',
      { limit: 20 }
    );

    res.json({
      syncedRetailers: results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// Existing Routes (Simplified)
// ===========================

app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blocks', authenticateToken, (req, res) => {
  try {
    const userBlocks = blocks.filter(b => b.userId === req.user.id);
    res.json(userBlocks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Click tracking redirect
app.get('/r/:userId/:blockId/:productId', async (req, res) => {
  try {
    const { userId, blockId, productId } = req.params;
    const { retailer } = req.query;

    // Queue click event for async processing
    await realTimeDataPipeline.enqueueEvent({
      type: 'click',
      data: {
        userId,
        blockId,
        productId,
        retailer: retailer || 'unknown',
        referrer: req.get('Referrer'),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      timestamp: new Date().toISOString()
    }, 'normal');

    // Generate affiliate URL
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const affiliateId = user.affiliateIds[retailer] || `${retailer}-user`;
    const retailerAdapter = retailerService.getRetailer(retailer);
    const redirectUrl = retailerAdapter.generateAffiliateUrl(productId, affiliateId);

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================
// Server Initialization
// ===========================

async function startServer() {
  try {
    // Initialize services
    await initializeServices();

    // Start server
    server.listen(PORT, () => {
      console.log(`KOTA PAL API v2.0 running on port ${PORT}`);
      console.log('Features enabled:');
      console.log('  ✓ Multi-retailer API integration');
      console.log('  ✓ Real-time data pipeline');
      console.log('  ✓ WebSocket live updates');
      console.log('  ✓ Advanced analytics');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await realTimeDataPipeline.disconnect();
      websocketService.close();
      server.close();
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
